import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const { id: alertId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: smsLogs, error } = await supabase
    .from("sms_logs")
    .select("*")
    .eq("alert_id", alertId)
    .order("sent_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    smsLogs: smsLogs ?? []
  });
}