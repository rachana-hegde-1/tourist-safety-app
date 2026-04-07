import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
    source?: string;
  };

  const latitude = typeof body.latitude === "number" ? body.latitude : null;
  const longitude = typeof body.longitude === "number" ? body.longitude : null;
  const accuracy = typeof body.accuracy === "number" ? body.accuracy : null;
  const source = typeof body.source === "string" ? body.source : "app";

  if (latitude === null || longitude === null) {
    return NextResponse.json({ ok: false, reason: "invalid_coords" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("locations").insert({
    clerk_user_id: userId,
    latitude,
    longitude,
    accuracy,
    source,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, clerk_user_id: userId });
}

