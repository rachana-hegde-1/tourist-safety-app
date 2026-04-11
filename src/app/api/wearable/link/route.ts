import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase";

const LinkWearableSchema = z.object({
  deviceId: z.string().min(10).max(50).regex(/^[a-zA-Z0-9_-]+$/),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LinkWearableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid device ID", details: parsed.error.issues }, { status: 400 });
  }

  const { deviceId } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: wearable, error: wearableError } = await supabase
    .from("wearables")
    .select("device_id, linked_user_id, is_active")
    .eq("device_id", deviceId)
    .single();

  if (wearableError) {
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }

  if (!wearable) {
    return NextResponse.json({ ok: false, error: "Wearable not found" }, { status: 404 });
  }

  if (wearable.linked_user_id) {
    return NextResponse.json({ ok: false, error: "Wearable already linked" }, { status: 400 });
  }

  if (!wearable.is_active) {
    return NextResponse.json({ ok: false, error: "Wearable is inactive" }, { status: 400 });
  }

  const { error: linkError } = await supabase
    .from("wearables")
    .update({ linked_user_id: userId })
    .eq("device_id", deviceId);

  if (linkError) {
    return NextResponse.json({ ok: false, error: "Failed to link wearable" }, { status: 500 });
  }

  const { error: updateTouristError } = await supabase
    .from("tourists")
    .update({ device_id: deviceId })
    .eq("clerk_user_id", userId);

  if (updateTouristError) {
    return NextResponse.json({ ok: false, error: "Failed to update tourist profile" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deviceId });
}
