"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useUser } from "@clerk/nextjs";

import { useLocationTracking, type TrackedLocation } from "@/hooks/useLocationTracking";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Props = {
  onLocation?: (loc: { latitude: number; longitude: number; accuracy: number | null; timestamp: number }) => void;
};

export default function TouristMap({ onLocation }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.CircleMarker | null>(null);

  const { location } = useLocationTracking();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [remoteLocation, setRemoteLocation] = React.useState<TrackedLocation | null>(null);

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const displayedLocation = React.useMemo(() => {
    if (!location) return remoteLocation;
    if (!remoteLocation) return location;
    return remoteLocation.timestamp >= location.timestamp ? remoteLocation : location;
  }, [location, remoteLocation]);

  React.useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([20.5937, 78.9629], 5); // India default

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!isUserLoaded || !user?.id) return;

    const channel = supabase
      .channel(`locations-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "locations", filter: `clerk_user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (typeof row.latitude !== "number" || typeof row.longitude !== "number") return;

          const timestamp = typeof row.timestamp === "number"
            ? row.timestamp
            : typeof row.timestamp === "string"
              ? Date.parse(row.timestamp)
              : row.created_at
                ? new Date(String(row.created_at)).getTime()
                : Date.now();

          setRemoteLocation({
            latitude: row.latitude,
            longitude: row.longitude,
            accuracy: typeof row.accuracy === "number" ? row.accuracy : null,
            timestamp,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUserLoaded, user?.id, supabase]);

  React.useEffect(() => {
    if (!isUserLoaded || !user?.id) return;

    const loadLatestLocation = async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("latitude,longitude,accuracy,timestamp,created_at")
        .eq("clerk_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const timestamp = typeof data.timestamp === "number"
        ? data.timestamp
        : typeof data.timestamp === "string"
          ? Date.parse(data.timestamp)
          : data.created_at
            ? new Date(data.created_at).getTime()
            : Date.now();

      setRemoteLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: typeof data.accuracy === "number" ? data.accuracy : null,
        timestamp,
      });
    };

    void loadLatestLocation();
  }, [isUserLoaded, user?.id, supabase]);

  React.useEffect(() => {
    if (!displayedLocation) return;
    const map = mapRef.current;
    if (!map) return;

    const latlng: L.LatLngExpression = [displayedLocation.latitude, displayedLocation.longitude];

    if (!markerRef.current) {
      markerRef.current = L.circleMarker(latlng, {
        radius: 10,
        color: "#2563eb",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latlng);
    }

    map.setView(latlng, Math.max(map.getZoom(), 15), { animate: true });
    onLocation?.({
      latitude: displayedLocation.latitude,
      longitude: displayedLocation.longitude,
      accuracy: displayedLocation.accuracy,
      timestamp: displayedLocation.timestamp,
    });
  }, [displayedLocation, onLocation]);

  // “Update every 15 seconds” — keep the map view/tiles healthy even if
  // watchPosition doesn't fire frequently.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const map = mapRef.current;
      if (!map) return;
      map.invalidateSize();
      if (displayedLocation) {
        map.panTo([displayedLocation.latitude, displayedLocation.longitude], { animate: false });
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [displayedLocation]);

  return <div ref={containerRef} className="h-[520px] w-full rounded-lg overflow-hidden" />;
}

