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
  const alertId = Number(id);
  if (!Number.isFinite(alertId)) {
    return NextResponse.json({ ok: false, reason: "invalid_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: alert, error } = await supabase
    .from("alerts")
    .select("id,clerk_user_id,type,message,latitude,longitude,created_at,status")
    .eq("id", alertId)
    .single();
  if (error || !alert) return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });

  const { data: tourist } = await supabase
    .from("tourists")
    .select("full_name")
    .eq("clerk_user_id", alert.clerk_user_id)
    .maybeSingle();

  const report = `E-FIR Draft
Alert ID: ${alert.id}
Type: ${alert.type}
Tourist: ${tourist?.full_name ?? "Tourist"}
Time: ${alert.created_at}
Status: ${alert.status}
Message: ${alert.message ?? "-"}
Location: https://maps.google.com/?q=${alert.latitude},${alert.longitude}
`;

  return NextResponse.json({ ok: true, report });
}

