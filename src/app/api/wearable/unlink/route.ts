import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { z } from "zod";

const UnlinkWearableSchema = z.object({
  deviceId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UnlinkWearableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid request payload" }, { status: 400 });
    }

    const { deviceId } = parsed.data;
    const supabase = createSupabaseAdminClient();

    // Get the tourist UUID
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id, device_id")
      .eq("clerk_user_id", userId)
      .single();

    if (touristError || !tourist) {
      return NextResponse.json({ ok: false, error: "Tourist not found" }, { status: 404 });
    }

    // Ensure the device belongs to the current user
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("tourist_id")
      .eq("device_id", deviceId)
      .single();

    if (wearableError || !wearable) {
      return NextResponse.json({ ok: false, error: "Wearable not found" }, { status: 404 });
    }

    if (wearable.tourist_id !== tourist.id) {
      return NextResponse.json({ ok: false, error: "Wearable does not belong to you" }, { status: 403 });
    }

    // Unlink from wearables table
    const { error: unlinkError } = await supabase
      .from("wearables")
      .update({ tourist_id: null, is_connected: false })
      .eq("device_id", deviceId);

    if (unlinkError) {
      console.error("Wearable unlink error:", unlinkError);
      return NextResponse.json({ ok: false, error: "Failed to unlink wearable" }, { status: 500 });
    }

    // Check if this was the active device on the tourist profile
    if (tourist.device_id === deviceId) {
      await supabase
        .from("tourists")
        .update({ device_id: null })
        .eq("clerk_user_id", userId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Wearable unlink API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
