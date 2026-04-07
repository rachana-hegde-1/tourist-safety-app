"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DetailResponse = {
  ok: boolean;
  tourist?: {
    full_name: string | null;
    photo_url: string | null;
    phone_number: string | null;
    destination: string | null;
    trip_start_date: string | null;
    trip_end_date: string | null;
    safety_score: number | null;
    device_id: string | null;
  };
  locations?: Array<{ latitude: number; longitude: number; created_at: string }>;
  alerts?: Array<{ id: number; type: string; status: string; created_at: string }>;
};

export function ProfileClient({ touristId }: { touristId: string }) {
  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const [data, setData] = React.useState<DetailResponse | null>(null);

  React.useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current).setView([20.5937, 78.9629], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/admin/tourists/${encodeURIComponent(touristId)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DetailResponse;
      if (!res.ok || !json.ok) return;
      setData(json);

      const map = mapRef.current;
      if (!map) return;
      const points = json.locations ?? [];
      if (points.length === 0) return;

      const latlngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);
      L.polyline(latlngs, { color: "#2563eb", weight: 3 }).addTo(map);
      L.circleMarker(latlngs[0], {
        radius: 8,
        color: "#dc2626",
        fillColor: "#dc2626",
        fillOpacity: 0.9,
      }).addTo(map);
      map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
    };
    void run();
  }, [touristId]);

  return (
    <div className="px-6 pb-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tourist profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-lg font-medium">{data?.tourist?.full_name ?? "Tourist"}</div>
            <div className="text-sm text-muted-foreground">{data?.tourist?.phone_number ?? "-"}</div>
            <div className="mt-2 text-sm">Destination: {data?.tourist?.destination ?? "-"}</div>
            <div className="text-sm">
              Trip: {(data?.tourist?.trip_start_date ?? "-") + " → " + (data?.tourist?.trip_end_date ?? "-")}
            </div>
            <div className="mt-2">
              <Badge
                variant={
                  (data?.tourist?.safety_score ?? 80) >= 80
                    ? "default"
                    : (data?.tourist?.safety_score ?? 80) >= 50
                      ? "secondary"
                      : "destructive"
                }
              >
                Safety: {data?.tourist?.safety_score ?? 80}
              </Badge>
            </div>
          </div>
          <div>
            <div ref={mapElRef} className="h-[320px] rounded-lg overflow-hidden" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(data?.alerts ?? []).map((a) => (
              <div key={a.id} className="text-sm border rounded p-2 flex items-center justify-between">
                <span>{a.type}</span>
                <span>{new Date(a.created_at).toLocaleString()}</span>
                <Badge variant={a.status === "RESOLVED" ? "default" : "secondary"}>{a.status}</Badge>
              </div>
            ))}
            {(data?.alerts ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No alerts found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

