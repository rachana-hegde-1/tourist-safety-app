import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = (searchParams.get("deviceId") ?? "").trim();

  if (!deviceId) {
    return NextResponse.json(
      { ok: false, available: false, reason: "missing_device_id" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("wearables")
    .select("device_id, linked_user_id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, available: false, reason: "db_error" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({
      ok: true,
      available: false,
      reason: "not_found",
    });
  }

  if (data.linked_user_id) {
    return NextResponse.json({
      ok: true,
      available: false,
      reason: "already_linked",
    });
  }

  return NextResponse.json({ ok: true, available: true });
}
