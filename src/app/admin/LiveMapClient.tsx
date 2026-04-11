"use client";

import * as React from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TouristPin = {
  tourist_id: string;
  name: string;
  photo_url: string | null;
  safety_score: number;
  last_seen: string;
  latitude: number;
  longitude: number;
  zone_status: "safe" | "unsafe";
  risk: "safe" | "moderate" | "danger";
};

type LiveResponse = {
  ok: boolean;
  tourists?: TouristPin[];
  stats?: {
    active_tourists: number;
    active_alerts: number;
    unsafe_zone_breaches: number;
  };
};

export function LiveMapClient() {
  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerLayerRef = React.useRef<L.LayerGroup | null>(null);
  const heatLayerRef = React.useRef<L.Layer | null>(null);

  const [tourists, setTourists] = React.useState<TouristPin[]>([]);
  const [stats, setStats] = React.useState({
    active_tourists: 0,
    active_alerts: 0,
    unsafe_zone_breaches: 0,
  });
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [showHeat, setShowHeat] = React.useState(false);

  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current).setView([20.5937, 78.9629], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/live", { cache: "no-store" });
    const json = (await res.json()) as LiveResponse;
    if (!res.ok || !json.ok) return;
    setTourists(json.tourists ?? []);
    setStats((prev) => json.stats ?? prev);
  }, []);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  React.useEffect(() => {
    if (isSubscribed) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("alerts-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        () => {
          void load();
        },
      )
      .subscribe();

    setIsSubscribed(true);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSubscribed, load]);

  React.useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    for (const t of tourists) {
      const color = t.risk === "safe" ? "#16a34a" : t.risk === "moderate" ? "#eab308" : "#dc2626";
      const marker = L.circleMarker([t.latitude, t.longitude], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(layer);

      const popup = `
        <div style="min-width:220px">
          <div style="display:flex;gap:8px;align-items:center;">
            ${t.photo_url ? `<img src="${t.photo_url}" alt="" style="width:40px;height:40px;border-radius:9999px;object-fit:cover;" />` : ""}
            <div>
              <div style="font-weight:600">${t.name}</div>
              <div style="font-size:12px;color:#666">Safety: ${t.safety_score}</div>
            </div>
          </div>
          <div style="font-size:12px;margin-top:8px;">Last seen: ${new Date(t.last_seen).toLocaleString()}</div>
          <div style="font-size:12px;">Zone: ${t.zone_status}</div>
          <a href="/admin/tourists/${t.tourist_id}" style="display:inline-block;margin-top:8px;text-decoration:underline;">View Full Profile</a>
        </div>
      `;
      marker.bindPopup(popup);
    }

    if (tourists.length > 0) {
      const bounds = L.latLngBounds(tourists.map((t) => [t.latitude, t.longitude] as [number, number]));
      map.fitBounds(bounds.pad(0.2));
    }
  }, [tourists]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (!showHeat || tourists.length === 0) return;

    const heatPoints = tourists.map((t) => [t.latitude, t.longitude, 0.7]) as Array<[number, number, number]>;
    const heatLayer = (L as unknown as { heatLayer: (points: Array<[number, number, number]>, opts: Record<string, unknown>) => L.Layer }).heatLayer(
      heatPoints,
      { radius: 25, blur: 20, maxZoom: 15 },
    );
    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;
  }, [showHeat, tourists]);

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <div className="px-6 pb-3 flex flex-wrap items-center gap-3">
        <Card><CardContent className="py-3 text-sm">Active tourists: <b>{stats.active_tourists}</b></CardContent></Card>
        <Card><CardContent className="py-3 text-sm">Active alerts: <b>{stats.active_alerts}</b></CardContent></Card>
        <Card><CardContent className="py-3 text-sm">Unsafe breaches: <b>{stats.unsafe_zone_breaches}</b></CardContent></Card>
        <Button type="button" variant="outline" onClick={() => setShowHeat((s) => !s)}>
          {showHeat ? "Hide heat layer" : "Show heat layer"}
        </Button>
        <Badge>{tourists.length} pins</Badge>
        <Link href="/admin/alerts" className="underline underline-offset-4 text-sm">Go to alerts</Link>
      </div>
      <div ref={mapElRef} className="h-[calc(100%-64px)] w-full" />
    </div>
  );
}

