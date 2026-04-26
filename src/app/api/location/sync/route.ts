import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { z } from "zod";

const SyncLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = SyncLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid location format" }, { status: 400 });
    }

    const { latitude, longitude } = parsed.data;
    const supabase = createSupabaseAdminClient();

    // Get the tourist UUID
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (touristError || !tourist) {
      return NextResponse.json({ ok: false, error: "Tourist not found" }, { status: 404 });
    }

    // Insert new location record
    const { error: insertError } = await supabase
      .from("locations")
      .insert({
        tourist_id: tourist.id,
        latitude,
        longitude,
        source: "phone_gps",
        timestamp: new Date().toISOString()
      });

    if (insertError) {
      console.error("Location sync error:", insertError);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Location sync API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
