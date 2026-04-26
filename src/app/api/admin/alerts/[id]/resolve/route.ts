import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function POST(
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
  const { error } = await supabase
    .from("alerts")
    .update({ resolved: true, resolved_by: actor.id })
    .eq("id", alertId);
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

