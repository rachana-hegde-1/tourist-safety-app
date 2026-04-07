import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";
import { generateFirCaseNumber } from "@/lib/efir";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const { id } = await context.params;
  const alertId = Number(id);
  if (!Number.isFinite(alertId)) {
    return NextResponse.json({ ok: false, reason: "invalid_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: alert, error: alertError } = await supabase
    .from("alerts")
    .select("id,clerk_user_id,type,message,status,latitude,longitude,created_at")
    .eq("id", alertId)
    .single();

  if (alertError || !alert) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const touristId = alert.clerk_user_id as string;

  const [{ data: tourist }, { data: contacts }, { data: lastGps }, { data: lastWearable }] =
    await Promise.all([
      supabase
        .from("tourists")
        .select("full_name,id_type,id_number,destination,trip_start_date,trip_end_date")
        .eq("clerk_user_id", touristId)
        .maybeSingle(),
      supabase
        .from("emergency_contacts")
        .select("name,phone_number,relationship,email")
        .eq("clerk_user_id", touristId),
      supabase
        .from("locations")
        .select("created_at")
        .eq("clerk_user_id", touristId)
        .eq("source", "app")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("locations")
        .select("created_at")
        .eq("clerk_user_id", touristId)
        .eq("source", "wearable")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const mapsUrl = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`;

  return NextResponse.json({
    ok: true,
    efir: {
      case_number: generateFirCaseNumber(),
      report_datetime: new Date().toISOString(),

      tourist_id: touristId,
      tourist_full_name: tourist?.full_name ?? null,
      tourist_nationality: null,
      tourist_id_type: tourist?.id_type ?? null,
      tourist_id_number: tourist?.id_number ?? null,

      last_known_lat: alert.latitude,
      last_known_lng: alert.longitude,
      last_known_maps_url: mapsUrl,

      last_gps_signal_at: lastGps?.created_at ?? null,
      last_wearable_signal_at: lastWearable?.created_at ?? null,

      alert_id: alert.id,
      alert_type: alert.type,
      alert_description: alert.message ?? null,

      emergency_contacts: contacts ?? [],
      itinerary: {
        destination: tourist?.destination ?? null,
        trip_start_date: tourist?.trip_start_date ?? null,
        trip_end_date: tourist?.trip_end_date ?? null,
      },

      admin_notes: "",
    },
  });
}

