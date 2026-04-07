import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const { id } = await context.params;
  const touristId = id;
  const supabase = createSupabaseAdminClient();

  const [touristRes, locationsRes, alertsRes] = await Promise.all([
    supabase
      .from("tourists")
      .select(
        "clerk_user_id,full_name,photo_url,phone_number,id_type,id_number,destination,trip_start_date,trip_end_date,preferred_language,safety_score,device_id,digital_id_hash",
      )
      .eq("clerk_user_id", touristId)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("latitude,longitude,accuracy,source,created_at")
      .eq("clerk_user_id", touristId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("alerts")
      .select("id,type,message,status,latitude,longitude,created_at")
      .eq("clerk_user_id", touristId)
      .order("created_at", { ascending: false }),
  ]);

  if (touristRes.error || !touristRes.data) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    tourist: touristRes.data,
    locations: locationsRes.data ?? [],
    alerts: alertsRes.data ?? [],
  });
}

