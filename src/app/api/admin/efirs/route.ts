import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

type EfirInput = {
  case_number: string;
  report_datetime: string;

  alert_id: number;
  tourist_id: string;

  tourist_full_name: string | null;
  tourist_nationality: string | null;
  tourist_id_type: string | null;
  tourist_id_number: string | null;

  last_known_lat: number | null;
  last_known_lng: number | null;
  last_known_maps_url: string | null;

  last_gps_signal_at: string | null;
  last_wearable_signal_at: string | null;

  alert_type: string | null;
  alert_description: string | null;

  emergency_contacts: unknown;
  itinerary: unknown;

  admin_notes: string | null;
};

export async function POST(request: Request) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const body = (await request.json()) as { efir?: EfirInput };
  if (!body.efir) {
    return NextResponse.json({ ok: false, reason: "missing_payload" }, { status: 400 });
  }

  const efir = body.efir;
  if (!efir.case_number || !efir.alert_id || !efir.tourist_id || !efir.report_datetime) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("efirs")
    .insert({
      case_number: efir.case_number,
      alert_id: efir.alert_id,
      tourist_id: efir.tourist_id,
      admin_clerk_id: actor.userId,
      report_datetime: efir.report_datetime,

      tourist_full_name: efir.tourist_full_name,
      tourist_nationality: efir.tourist_nationality,
      tourist_id_type: efir.tourist_id_type,
      tourist_id_number: efir.tourist_id_number,

      last_known_lat: efir.last_known_lat,
      last_known_lng: efir.last_known_lng,
      last_known_maps_url: efir.last_known_maps_url,

      last_gps_signal_at: efir.last_gps_signal_at,
      last_wearable_signal_at: efir.last_wearable_signal_at,

      alert_type: efir.alert_type,
      alert_description: efir.alert_description,

      emergency_contacts: efir.emergency_contacts,
      itinerary: efir.itinerary,

      admin_notes: efir.admin_notes,
    })
    .select("id,case_number,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, efir: data });
}

