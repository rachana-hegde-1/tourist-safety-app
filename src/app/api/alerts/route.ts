import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alerts: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type?: string;
    message?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
    source?: string;
  };

  const type = typeof body.type === "string" ? body.type : null;
  const message = typeof body.message === "string" ? body.message : null;
  const latitude = typeof body.latitude === "number" ? body.latitude : null;
  const longitude = typeof body.longitude === "number" ? body.longitude : null;
  const accuracy = typeof body.accuracy === "number" ? body.accuracy : null;
  const source = typeof body.source === "string" ? body.source : "app";

  if (!type) {
    return NextResponse.json({ ok: false, reason: "missing_type" }, { status: 400 });
  }
  if (latitude === null || longitude === null) {
    return NextResponse.json({ ok: false, reason: "missing_coords" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("alerts").insert({
    clerk_user_id: userId,
    type,
    message,
    status: "OPEN",
    latitude,
    longitude,
    accuracy,
    source,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

