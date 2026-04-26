import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase";

const LinkWearableSchema = z.object({
  deviceId: z.string().min(10).max(50).regex(/^[a-zA-Z0-9_-]+$/),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Unauthorized - Please log in" 
      }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid JSON in request body" 
      }, { status: 400 });
    }

    const parsed = LinkWearableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: "Invalid device ID format",
        details: parsed.error.issues.map(issue => issue.message)
      }, { status: 400 });
    }

    const { deviceId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    // First check if the tourist exists
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("clerk_user_id")
      .eq("clerk_user_id", userId)
      .single();

    if (touristError || !tourist) {
      return NextResponse.json({ 
        ok: false, 
        error: "Tourist profile not found" 
      }, { status: 404 });
    }

    // Find the wearable device
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("device_id, tourist_id, is_connected")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (wearableError) {
      console.error("Wearable query error:", wearableError);
      return NextResponse.json({ 
        ok: false, 
        error: "Database error checking wearable" 
      }, { status: 500 });
    }

    if (!wearable) {
      return NextResponse.json({ 
        ok: false, 
        error: "Device ID not found" 
      }, { status: 404 });
    }

    if (wearable.tourist_id && wearable.tourist_id !== userId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Wearable already linked to another user" 
      }, { status: 400 });
    }

    // Link the wearable to the tourist
    const { error: linkError } = await supabase
      .from("wearables")
      .update({ 
        tourist_id: userId,
        is_connected: true
      })
      .eq("device_id", deviceId);

    if (linkError) {
      console.error("Link wearable error:", linkError);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to link wearable device" 
      }, { status: 500 });
    }

    // Update tourist profile with device ID
    const { error: updateTouristError } = await supabase
      .from("tourists")
      .update({ 
        device_id: deviceId,
        updated_at: new Date().toISOString()
      })
      .eq("clerk_user_id", userId);

    if (updateTouristError) {
      console.error("Update tourist error:", updateTouristError);
      return NextResponse.json({ 
        ok: false, 
        error: "Failed to update tourist profile" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Wearable linked successfully",
      deviceId 
    });

  } catch (error) {
    console.error("Wearable link error:", error);
    return NextResponse.json({
      ok: false,
      error: "Internal server error - Please try again"
    }, { status: 500 });
  }
}
