import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const activeParam = searchParams.get("active");
  const onlyActive = activeParam === "true";

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("zones")
    .select("id,name,type,center_lat,center_lng,radius_meters,active,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (onlyActive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true, zones: data ?? [] });
}

export async function POST(request: Request) {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    type?: "Safe" | "Unsafe";
    center_lat?: number;
    center_lng?: number;
    radius_meters?: number;
    active?: boolean;
  };

  if (!body.name || !body.type) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }
  if (typeof body.center_lat !== "number" || typeof body.center_lng !== "number") {
    return NextResponse.json({ ok: false, reason: "missing_center" }, { status: 400 });
  }
  if (typeof body.radius_meters !== "number" || body.radius_meters <= 0) {
    return NextResponse.json({ ok: false, reason: "invalid_radius" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("zones")
    .insert({
      name: body.name.trim(),
      type: body.type,
      center_lat: body.center_lat,
      center_lng: body.center_lng,
      radius_meters: body.radius_meters,
      active: body.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("id,name,type,center_lat,center_lng,radius_meters,active,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true, zone: data });
}

