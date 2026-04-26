import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const supabase = createSupabaseAdminClient();
  const [{ data: tourists, error }, { data: locations }] = await Promise.all([
    supabase
      .from("tourists")
      .select("id, clerk_user_id,full_name,photo_url,id_type,trip_start_date,trip_end_date,safety_score,device_id")
      .eq("onboarding_completed", true),
    supabase
      .from("locations")
      .select("tourist_id,created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  const latestLocation = new Map<string, string>();
  for (const loc of locations ?? []) {
    if (!latestLocation.has(loc.tourist_id)) {
      latestLocation.set(loc.tourist_id, loc.created_at);
    }
  }

  const rows = (tourists ?? [])
    .map((t) => ({
      tourist_id: t.clerk_user_id,
      photo_url: t.photo_url,
      name: t.full_name ?? "Tourist",
      nationality: "-", // placeholder until explicit column exists
      trip_start_date: t.trip_start_date,
      trip_end_date: t.trip_end_date,
      safety_score: typeof t.safety_score === "number" ? t.safety_score : 80,
      wearable_connected: Boolean(t.device_id),
      last_seen: latestLocation.get(t.id) ?? null,
      id_type: t.id_type ?? null,
    }))
    .filter((r) => (q ? r.name.toLowerCase().includes(q) : true));

  return NextResponse.json({ ok: true, tourists: rows });
}
