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

    // First get the tourist's Supabase ID
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
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
      .select("id, device_id, linked_user_id, is_active")
      .eq("device_id", deviceId)
      .single();

    if (wearableError || !wearable) {
      return NextResponse.json({ 
        ok: false, 
        error: "Device ID not found" 
      }, { status: 404 });
    }

    if (wearable.linked_user_id) {
      return NextResponse.json({ 
        ok: false, 
        error: "Wearable already linked to another user" 
      }, { status: 400 });
    }

    if (!wearable.is_active) {
      return NextResponse.json({ 
        ok: false, 
        error: "Wearable is inactive and cannot be linked" 
      }, { status: 400 });
    }

    // Link the wearable to the tourist using the tourist's Supabase ID
    const { error: linkError } = await supabase
      .from("wearables")
      .update({ linked_user_id: tourist.id })
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
      .update({ device_id: deviceId })
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
