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
  const [trackingStatus, setTrackingStatus] = React.useState<"ok" | "expired" | "invalid">("ok");

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
    if (trackingStatus !== "ok") return;
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}/location`, {
        cache: "no-store",
      });
      const json = (await res.json()) as TrackResponse;
      if (!res.ok || !json.ok) {
        if (json.reason === "link_expired") {
          setTrackingStatus("expired");
        } else if (json.reason === "invalid_token") {
          setTrackingStatus("invalid");
        }
        return;
      }
      setTrackingStatus("ok");
      setTouristName(json.tourist_name ?? "Tourist");
      setLastLoc(json.location ?? null);
      if (json.location) {
        updateMap(json.location.latitude, json.location.longitude);
      }
    } catch {
      // ignore poll failures
    }
  }, [token, updateMap, trackingStatus]);

  const isExpired = trackingStatus === "expired";

  React.useEffect(() => {
    void fetchLocation();
    const id = window.setInterval(() => {
      void fetchLocation();
    }, 20_000);
    return () => window.clearInterval(id);
  }, [fetchLocation]);

  if (trackingStatus !== "ok") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                {trackingStatus === "expired"
                  ? "This tracking link has expired"
                  : "Invalid tracking link"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {trackingStatus === "expired"
                  ? "The tracking link you opened is no longer active. Please ask the tourist to generate a new link."
                  : "The tracking link is invalid. Please verify the link or request a new one from the tourist."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

