import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";

export async function GET() {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("id,tourist_id,type,message,resolved,latitude,longitude,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  const ids = [...new Set((alerts ?? []).map((a) => a.tourist_id))];
  const { data: tourists } = ids.length
    ? await supabase
        .from("tourists")
        .select("id,clerk_user_id,full_name,photo_url")
        .in("id", ids)
    : { data: [] as Array<{ id: string; clerk_user_id: string; full_name: string | null; photo_url: string | null }> };

  const touristMap = new Map((tourists ?? []).map((t) => [t.id, t]));

  const sorted = [...(alerts ?? [])].sort((a, b) => {
    const ap = a.type?.toUpperCase() === "PANIC" ? 0 : 1;
    const bp = b.type?.toUpperCase() === "PANIC" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({
    ok: true,
    alerts: sorted.map((a) => ({
      ...a,
      status: a.resolved ? "RESOLVED" : "OPEN",
      clerk_user_id: touristMap.get(a.tourist_id)?.clerk_user_id ?? "",
      tourist_name: touristMap.get(a.tourist_id)?.full_name ?? "Tourist",
      tourist_photo: touristMap.get(a.tourist_id)?.photo_url ?? null,
    })),
  });
}
