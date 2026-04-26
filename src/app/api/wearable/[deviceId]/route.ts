import { NextResponse } from "next/server";
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
const getRateLimiter = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis env vars. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds per device
  });
};

let rateLimiter: Ratelimit | undefined;
const getRateLimit = () => {
  if (!rateLimiter) {
    rateLimiter = getRateLimiter();
  }
  return rateLimiter;
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Device-Secret',
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { deviceId } = await params;
    
    // Validate device ID
    const deviceIdValidation = DeviceIdSchema.safeParse(deviceId);
    if (!deviceIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid device ID format" },
        { 
          status: 400, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    // Get device secret from header
    const deviceSecret = request.headers.get("x-device-secret");
    if (!deviceSecret) {
      return NextResponse.json(
        { error: "Device secret required" },
        { 
          status: 401, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    // Verify device secret (in production, you'd verify against database)
    const expectedSecret = process.env.WEARABLE_API_SECRET;
    if (deviceSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid device secret" },
        { 
          status: 401, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    // Apply rate limiting
    const identifier = `wearable:${deviceId}`;
    const { success, limit, reset, remaining } = await getRateLimit().limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: reset },
        { 
          status: 429, 
          headers: {
            ...securityHeaders,
            ...corsHeaders,
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
        { 
          status: 400, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    const { latitude, longitude, sos_triggered, fall_detected, low_battery, battery_level } = bodyValidation.data;

    const supabase = createSecureSupabaseClient();

    // Check if wearable exists and is linked
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("device_id, tourist_id, is_connected")
      .eq("device_id", deviceId)
      .single();

    if (wearableError || !wearable || !wearable.is_connected || !wearable.tourist_id) {
      return NextResponse.json(
        { error: "Wearable device not found or not linked" },
        { 
          status: 404, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    // Get tourist UUID for locations table
    const { data: tourist } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", wearable.tourist_id)
      .maybeSingle();

    if (!tourist) {
      return NextResponse.json(
        { error: "Tourist profile not found for linked user" },
        { status: 404, headers: { ...securityHeaders, ...corsHeaders } }
      );
    }

    // Create location record
    const { error: locationError } = await supabase
      .from("locations")
      .insert({
        tourist_id: tourist.id,
        latitude,
        longitude,
        source: "wearable",
        device_id: deviceId,
        timestamp: new Date().toISOString(),
      });

    if (locationError) {
      console.error("Location insertion error:", locationError);
      return NextResponse.json(
        { error: "Failed to save location data" },
        { 
          status: 500, 
          headers: { ...securityHeaders, ...corsHeaders } 
        }
      );
    }

    // --- AI Anomaly Detection Trigger ---
    try {
      const { data: recentLocations } = await supabase
        .from("locations")
        .select("*")
        .eq("tourist_id", tourist.id)
        .order("timestamp", { ascending: false })
        .limit(10);

      if (recentLocations && recentLocations.length > 2) {
        import("@/lib/anomaly-detection").then(({ analyzeLocationHistory }) => {
          analyzeLocationHistory(recentLocations).then(async (anomalyAnalysis) => {
            if (anomalyAnalysis && anomalyAnalysis.isAnomaly && anomalyAnalysis.confidence > 80) {
              await supabase.from("alerts").insert({
                tourist_id: tourist.id,
                type: "ANOMALY",
                message: `AI Anomaly Detected (Wearable Data): ${anomalyAnalysis.reason}`,
                latitude,
                longitude,
                created_at: new Date().toISOString(),
              });
            }
          }).catch((err) => console.error("Error analyzing AI Anomaly", err));
        }).catch((err) => console.error("Failed to import anomaly-detection utility", err));
      }
    } catch (err) {
      console.error("Anomaly detection DB query failed", err);
    }
    // ------------------------------------

    // Helper function to create alerts
    const createAlert = async (type: string, message?: string) => {
      const { error: alertError } = await supabase
        .from("alerts")
        .insert({
          tourist_id: tourist.id,
          type: type.toUpperCase(),
          latitude,
          longitude,
          message: message || `${type} detected from wearable device`,
          created_at: new Date().toISOString(),
        });

      if (alertError) {
        console.error(`Failed to create ${type} alert:`, alertError);
      }
    };

    // Create alerts based on data
    if (sos_triggered) {
      await createAlert("PANIC", "SOS button activated on wearable device");
    }

    if (fall_detected) {
      await createAlert("FALL_DETECTED", "Fall detected by wearable device");
    }

    if (low_battery) {
      await createAlert("LOW_BATTERY", `Low battery detected: ${battery_level}%`);
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
          ...corsHeaders,
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
      { 
        status: 500, 
        headers: { ...securityHeaders, ...corsHeaders } 
      }
    );
  }
}
