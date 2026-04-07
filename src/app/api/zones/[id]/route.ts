import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const zoneId = Number(id);
  if (!Number.isFinite(zoneId)) {
    return NextResponse.json({ ok: false, reason: "invalid_id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    type?: "Safe" | "Unsafe";
    center_lat?: number;
    center_lng?: number;
    radius_meters?: number;
    active?: boolean;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (body.type === "Safe" || body.type === "Unsafe") patch.type = body.type;
  if (typeof body.center_lat === "number") patch.center_lat = body.center_lat;
  if (typeof body.center_lng === "number") patch.center_lng = body.center_lng;
  if (typeof body.radius_meters === "number") patch.radius_meters = body.radius_meters;
  if (typeof body.active === "boolean") patch.active = body.active;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("zones")
    .update(patch)
    .eq("id", zoneId)
    .select("id,name,type,center_lat,center_lng,radius_meters,active,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true, zone: data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const zoneId = Number(id);
  if (!Number.isFinite(zoneId)) {
    return NextResponse.json({ ok: false, reason: "invalid_id" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("zones").delete().eq("id", zoneId);
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

