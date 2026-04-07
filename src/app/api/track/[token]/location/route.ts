import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: link, error: linkError } = await supabase
    .from("tracking_links")
    .select("tourist_id, active, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (linkError || !link) {
    return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 404 });
  }

  if (!link.active || link.expires_at < now) {
    return NextResponse.json({ ok: false, reason: "link_expired" }, { status: 410 });
  }

  const touristId = link.tourist_id as string;

  const [{ data: tourist }, { data: location }] = await Promise.all([
    supabase
      .from("tourists")
      .select("full_name")
      .eq("clerk_user_id", touristId)
      .maybeSingle(),
    supabase
      .from("locations")
      .select("latitude, longitude, accuracy, created_at")
      .eq("clerk_user_id", touristId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    tourist_name: tourist?.full_name ?? "Tourist",
    location: location ?? null,
  });
}

