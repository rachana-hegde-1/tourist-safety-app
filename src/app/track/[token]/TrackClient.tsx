"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type TrackResponse = {
  ok: boolean;
  tourist_name?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    created_at?: string;
  } | null;
  reason?: string;
};

export function TrackClient({ token }: { token: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.CircleMarker | null>(null);

  const [touristName, setTouristName] = React.useState("Tourist");
  const [shareUrl, setShareUrl] = React.useState("");
  const [lastLoc, setLastLoc] = React.useState<TrackResponse["location"]>(null);
  const [isExpired, setIsExpired] = React.useState(false);

  React.useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5);
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

  const updateMap = React.useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const pos: L.LatLngExpression = [lat, lng];
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(pos, {
        radius: 10,
        color: "#2563eb",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.9,
      }).addTo(map);
      map.setView(pos, 15);
    } else {
      markerRef.current.setLatLng(pos);
      map.panTo(pos);
    }
  }, []);

  const fetchLocation = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}/location`, {
        cache: "no-store",
      });
      const json = (await res.json()) as TrackResponse;
      if (!res.ok || !json.ok) {
        if (json.reason === "link_expired") setIsExpired(true);
        return;
      }
      setTouristName(json.tourist_name ?? "Tourist");
      setLastLoc(json.location ?? null);
      if (json.location) {
        updateMap(json.location.latitude, json.location.longitude);
      }
    } catch {
      // ignore poll failures
    }
  }, [token, updateMap]);

  React.useEffect(() => {
    void fetchLocation();
    const id = window.setInterval(() => {
      void fetchLocation();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [fetchLocation]);

  function whatsappShare() {
    if (!shareUrl) return;
    const text = `Live tourist tracking link: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Tracking link copied.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Live tracking: {touristName}
              {isExpired ? " (expired)" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={containerRef} className="h-[520px] w-full rounded-lg overflow-hidden" />
            <div className="mt-3 text-xs text-muted-foreground">
              Refreshes every 20 seconds.
              {lastLoc
                ? ` Last update: ${
                    lastLoc.created_at ? new Date(lastLoc.created_at).toLocaleString() : "just now"
                  }`
                : " Waiting for first location update..."}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={whatsappShare}>
                Share on WhatsApp
              </Button>
              <Button type="button" variant="outline" onClick={copyLink}>
                Copy link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

