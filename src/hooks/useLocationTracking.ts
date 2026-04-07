"use client";

import * as React from "react";
import { toast } from "sonner";

export type TrackedLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

type Status = "idle" | "requesting" | "tracking" | "error" | "unsupported";

type Zone = {
  id: number;
  name: string;
  type: "Safe" | "Unsafe";
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  active: boolean;
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

// distance = 2R × arcsin(√(sin²((lat2-lat1)/2) + cos(lat1)×cos(lat2)×sin²((lng2-lng1)/2)))
function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const dPhi = toRadians(lat2 - lat1);
  const dLambda = toRadians(lng2 - lng1);

  const insideRoot =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(insideRoot));
}

async function maybeNotifyBrowser(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

async function checkZoneBreach(
  lat: number,
  lng: number,
  touristId: string,
  previouslyInsideUnsafeZoneIds: Set<number>,
) {
  const zonesRes = await fetch("/api/zones?active=true", { cache: "no-store" });
  const zonesJson = (await zonesRes.json()) as { ok: boolean; zones?: Zone[] };
  if (!zonesRes.ok || !zonesJson.ok) return previouslyInsideUnsafeZoneIds;

  const zones = zonesJson.zones ?? [];
  const unsafeZones = zones.filter((z) => z.type === "Unsafe" && z.active);

  const currentlyInside = new Set<number>();
  for (const zone of unsafeZones) {
    const distance = haversineDistanceMeters(lat, lng, zone.center_lat, zone.center_lng);
    if (distance <= zone.radius_meters) {
      currentlyInside.add(zone.id);
    }
  }

  // Entered unsafe zones
  for (const zoneId of currentlyInside) {
    if (previouslyInsideUnsafeZoneIds.has(zoneId)) continue;
    const zone = unsafeZones.find((z) => z.id === zoneId);
    if (!zone) continue;

    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "GEO_BREACH",
        latitude: lat,
        longitude: lng,
        source: "app",
        touristId,
        meta: { zone_id: zone.id, zone_name: zone.name },
      }),
    });

    const text = `Warning: You have entered restricted zone "${zone.name}".`;
    toast.warning(text);
    await maybeNotifyBrowser("Restricted zone warning", text);
  }

  // Exited unsafe zones
  for (const zoneId of previouslyInsideUnsafeZoneIds) {
    if (currentlyInside.has(zoneId)) continue;
    toast.success("You have left the restricted area.");
  }

  return currentlyInside;
}

export function useLocationTracking() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [location, setLocation] = React.useState<TrackedLocation | null>(null);

  const lastSentAtRef = React.useRef<number>(0);
  const touristIdRef = React.useRef<string>("self");
  const insideUnsafeZoneIdsRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setStatus("requesting");

    const onSuccess: PositionCallback = (pos) => {
      const next: TrackedLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : null,
        timestamp: pos.timestamp,
      };
      setLocation(next);
      setStatus("tracking");
      setError(null);

      // Ensure we don't spam writes if the device reports extremely frequently.
      const now = Date.now();
      if (now - lastSentAtRef.current < 1000) return;
      lastSentAtRef.current = now;

      fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: next.latitude,
          longitude: next.longitude,
          accuracy: next.accuracy,
          source: "app",
        }),
      })
        .then(async (res) => {
          const json = (await res.json()) as { ok: boolean; clerk_user_id?: string };
          if (json.clerk_user_id) touristIdRef.current = json.clerk_user_id;
        })
        .catch(() => {
          // Ignore transient network errors; we keep tracking locally.
        });

      checkZoneBreach(
        next.latitude,
        next.longitude,
        touristIdRef.current,
        insideUnsafeZoneIdsRef.current,
      )
        .then((updated) => {
          insideUnsafeZoneIdsRef.current = updated;
        })
        .catch(() => {
        // Ignore transient network errors; we keep tracking locally.
        });
    };

    const onError: PositionErrorCallback = (e) => {
      setStatus("error");
      setError(e.message || "Failed to get location.");
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 20_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { status, error, location };
}

