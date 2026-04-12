import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

// Zod schemas for input validation
const WearableDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sos_triggered: z.boolean().optional(),
  fall_detected: z.boolean().optional(),
  low_battery: z.boolean().optional(),
  battery_level: z.number().min(0).max(100).optional(),
});

// Device ID validation schema
const DeviceIdSchema = z.string().min(10).max(50).regex(/^[a-zA-Z0-9_-]+$/);

// Rate limiting configuration
const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds per device
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    
    // Validate device ID
    const deviceIdValidation = DeviceIdSchema.safeParse(deviceId);
    if (!deviceIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid device ID format" },
        { status: 400, headers: securityHeaders }
      );
    }

    // Get device secret from header
    const deviceSecret = request.headers.get("x-device-secret");
    if (!deviceSecret) {
      return NextResponse.json(
        { error: "Device secret required" },
        { status: 401, headers: securityHeaders }
      );
    }

    // Verify device secret (in production, you'd verify against database)
    const expectedSecret = process.env.WEARABLE_API_SECRET;
    if (deviceSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid device secret" },
        { status: 401, headers: securityHeaders }
      );
    }

    // Apply rate limiting
    const identifier = `wearable:${deviceId}`;
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: reset },
        { 
          status: 429, 
          headers: {
            ...securityHeaders,
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          }
        }
      );
    }

    // Validate request body
    const body = await request.json();
    const bodyValidation = WearableDataSchema.safeParse(body);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyValidation.error.issues },
        { status: 400, headers: securityHeaders }
      );
    }

    const { latitude, longitude, sos_triggered, fall_detected, low_battery, battery_level } = bodyValidation.data;

    const supabase = createSecureSupabaseClient();

    // Check if wearable exists and is linked
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("device_id, linked_user_id, is_active")
      .eq("device_id", deviceId)
      .single();

    if (wearableError || !wearable || !wearable.is_active || !wearable.linked_user_id) {
      return NextResponse.json(
        { error: "Wearable device not found or not linked" },
        { status: 404, headers: securityHeaders }
      );
    }

    // Create location record
    const { error: locationError } = await supabase
      .from("locations")
      .insert({
        clerk_user_id: wearable.linked_user_id,
        user_id: wearable.linked_user_id,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        source: "wearable",
        device_id: deviceId,
      });

    if (locationError) {
      console.error("Location insertion error:", locationError);
      return NextResponse.json(
        { error: "Failed to save location data" },
        { status: 500, headers: securityHeaders }
      );
    }

    // Helper function to create alerts
    const createAlert = async (type: string, message?: string) => {
      const { error: alertError } = await supabase
        .from("alerts")
        .insert({
          clerk_user_id: wearable.linked_user_id,
          type,
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
          device_id: deviceId,
          status: "OPEN",
          message: message || `${type} detected from wearable device`,
        });

      if (alertError) {
        console.error(`Failed to create ${type} alert:`, alertError);
      }
    };

    // Create alerts based on data
    if (sos_triggered) {
      await createAlert("panic", "SOS button activated on wearable device");
    }

    if (fall_detected) {
      await createAlert("fall", "Fall detected by wearable device");
    }

    if (low_battery) {
      await createAlert("low_battery", `Low battery detected: ${battery_level}%`);
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Wearable data processed successfully",
        data: {
          deviceId,
          latitude,
          longitude,
          sos_triggered,
          fall_detected,
          low_battery,
          battery_level
        }
      },
      { 
        status: 200,
        headers: {
          ...securityHeaders,
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        }
      }
    );

  } catch (error) {
    console.error("Wearable API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: securityHeaders }
    );
  }
}
