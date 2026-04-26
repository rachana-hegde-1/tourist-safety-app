"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, Share2, Copy, AlertCircle, Clock, Navigation } from "lucide-react";

type TrackResponse = {
  ok: boolean;
  tourist_name?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp?: string;
  } | null;
  reason?: string;
};

export function TrackClient({ token }: { token: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = React.useRef<L.Circle | null>(null);

  const [touristName, setTouristName] = React.useState("Tourist");
  const [shareUrl, setShareUrl] = React.useState("");
  const [lastLoc, setLastLoc] = React.useState<TrackResponse["location"]>(null);
  const [trackingStatus, setTrackingStatus] = React.useState<"ok" | "expired" | "invalid">("ok");
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map with a relative, z-0 container to prevent overlap
    const map = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([20.5937, 78.9629], 5);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    }).addTo(map);
    
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const updateMap = React.useCallback((lat: number, lng: number, accuracy?: number | null) => {
    const map = mapRef.current;
    if (!map) return;
    const pos: L.LatLngExpression = [lat, lng];

    if (!markerRef.current) {
      // Add accuracy circle
      if (accuracy) {
        accuracyCircleRef.current = L.circle(pos, {
          radius: accuracy,
          color: "#3b82f6",
          weight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
        }).addTo(map);
      }

      // Add center marker
      markerRef.current = L.circleMarker(pos, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#3b82f6",
        fillOpacity: 1,
      }).addTo(map);
      
      // Pulse animation effect could be added here via CSS classes
      
      map.setView(pos, 16);
    } else {
      markerRef.current.setLatLng(pos);
      if (accuracyCircleRef.current && accuracy) {
        accuracyCircleRef.current.setLatLng(pos);
        accuracyCircleRef.current.setRadius(accuracy);
      }
      map.panTo(pos, { animate: true, duration: 1.5 });
    }
  }, []);

  const fetchLocation = React.useCallback(async () => {
    if (trackingStatus !== "ok") return;
    try {
      setIsUpdating(true);
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
        updateMap(json.location.latitude, json.location.longitude, json.location.accuracy);
      }
    } catch {
      // ignore poll failures
    } finally {
      setTimeout(() => setIsUpdating(false), 800); // Visual feedback delay
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800">
            <CardContent className="pt-10 pb-8 px-8 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {trackingStatus === "expired" ? "Link Expired" : "Invalid Link"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                {trackingStatus === "expired"
                  ? "This tracking link is no longer active. Please ask the tourist to generate a new secure link."
                  : "The tracking link is invalid or malformed. Please verify the link."
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function whatsappShare() {
    if (!shareUrl) return;
    const text = `Live tourist tracking link for ${touristName}: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Tracking link copied to clipboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Live Tracking
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {touristName} {isExpired && <span className="text-red-500">(Expired)</span>}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${isUpdating ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <span className={`relative flex h-2 w-2`}>
                {isUpdating && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isUpdating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              {isUpdating ? "Updating..." : "Live"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Map Card */}
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-800 rounded-2xl">
          <div className="relative z-0">
            {/* The Map */}
            <div ref={containerRef} className="h-[60vh] sm:h-[600px] w-full bg-slate-100 dark:bg-slate-800" />
            
            {/* Floating Status Badge for Mobile */}
            <div className="absolute top-4 right-4 z-[400] sm:hidden">
              <div className="bg-white/90 backdrop-blur-md shadow-lg dark:bg-slate-900/90 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700">
                <span className={`relative flex h-2 w-2`}>
                  {isUpdating && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isUpdating ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                {isUpdating ? "Updating" : "Live"}
              </div>
            </div>
          </div>
          
          <CardContent className="bg-white dark:bg-slate-900 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Last Update</p>
                <p>
                  {lastLoc && lastLoc.timestamp
                    ? new Date(lastLoc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : lastLoc ? "Just now" : "Waiting for GPS signal..."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                type="button" 
                onClick={whatsappShare}
                className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#1DA851] text-white gap-2 font-medium"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={copyLink}
                className="flex-1 sm:flex-none gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-700"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
