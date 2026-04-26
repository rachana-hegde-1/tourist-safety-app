import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdminOrPoliceApi } from "@/lib/admin-auth";
import { haversineDistanceMeters } from "@/lib/geo";

type ZoneRow = {
  id: number;
  type: "Safe" | "Unsafe";
  name: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  active: boolean;
};

export async function GET() {
  const actor = await requireAdminOrPoliceApi();
  if (!actor) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const activeSince = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const [touristsRes, locationsRes, alertsRes, zonesRes] = await Promise.all([
    supabase
      .from("tourists")
      .select("id, clerk_user_id,full_name,photo_url,safety_score")
      .eq("onboarding_completed", true),
    supabase
      .from("locations")
      .select("tourist_id,latitude,longitude,created_at")
      .gte("created_at", activeSince)
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("id,clerk_user_id,type,status,created_at")
      .eq("status", "OPEN")
      .order("created_at", { ascending: false }),
    supabase
      .from("zones")
      .select("id,type,name,center_lat,center_lng,radius_meters,active")
      .eq("active", true),
  ]);

  if (touristsRes.error || locationsRes.error || alertsRes.error || zonesRes.error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  const latestByTouristId = new Map<string, (typeof locationsRes.data)[number]>();
  for (const loc of locationsRes.data ?? []) {
    if (!latestByTouristId.has(loc.tourist_id)) latestByTouristId.set(loc.tourist_id, loc);
  }

  const alertsByTourist = new Map<string, Array<(typeof alertsRes.data)[number]>>();
  for (const a of alertsRes.data ?? []) {
    const list = alertsByTourist.get(a.clerk_user_id) ?? [];
    list.push(a);
    alertsByTourist.set(a.clerk_user_id, list);
  }

  const zones = (zonesRes.data ?? []) as ZoneRow[];
  let unsafeZoneBreaches = 0;

  const tourists = (touristsRes.data ?? [])
    .map((t) => {
      const loc = latestByTouristId.get(t.id);
      if (!loc) return null;

      const tAlerts = alertsByTourist.get(t.clerk_user_id) ?? [];
      const hasOpenPanic = tAlerts.some((a) => a.type?.toUpperCase() === "PANIC");
      const score = typeof t.safety_score === "number" ? t.safety_score : 80;

      let risk: "safe" | "moderate" | "danger" = "safe";
      if (hasOpenPanic || score < 50) risk = "danger";
      else if (score < 80) risk = "moderate";

      let zoneStatus: "safe" | "unsafe" = "safe";
      for (const zone of zones) {
        if (zone.type !== "Unsafe") continue;
        const distance = haversineDistanceMeters(
          loc.latitude,
          loc.longitude,
          zone.center_lat,
          zone.center_lng,
        );
        if (distance <= zone.radius_meters) {
          zoneStatus = "unsafe";
          unsafeZoneBreaches += 1;
          break;
        }
      }

      return {
        tourist_id: t.clerk_user_id,
        name: t.full_name ?? "Tourist",
        photo_url: t.photo_url,
        safety_score: score,
        last_seen: loc.created_at,
        latitude: loc.latitude,
        longitude: loc.longitude,
        zone_status: zoneStatus,
        risk,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    ok: true,
    tourists,
    stats: {
      active_tourists: tourists.length,
      active_alerts: (alertsRes.data ?? []).length,
      unsafe_zone_breaches: unsafeZoneBreaches,
    },
  });
}

