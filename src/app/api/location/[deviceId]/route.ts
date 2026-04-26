import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    
    if (!deviceId) {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Find the linked user for this device
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("tourist_id")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (wearableError || !wearable || !wearable.tourist_id) {
      return NextResponse.json(
        { error: "Device not found or not linked" },
        { status: 404 }
      );
    }

    // Get the latest location for this user
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("latitude, longitude")
      .eq("tourist_id", wearable.tourist_id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "No location found" },
        { status: 404 }
      );
    }

    // Return in the exact format expected by the watch
    return NextResponse.json({
      lat: location.latitude,
      lon: location.longitude,
    });
  } catch (error) {
    console.error("Location polling error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
