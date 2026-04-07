"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { useLocationTracking } from "@/hooks/useLocationTracking";

type Props = {
  onLocation?: (loc: { latitude: number; longitude: number; accuracy: number | null }) => void;
};

export function TouristMap({ onLocation }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.CircleMarker | null>(null);

  const { location } = useLocationTracking();

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
    if (!location) return;
    const map = mapRef.current;
    if (!map) return;

    const latlng: L.LatLngExpression = [location.latitude, location.longitude];

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
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
    });
  }, [location, onLocation]);

  // “Update every 15 seconds” — keep the map view/tiles healthy even if
  // watchPosition doesn't fire frequently.
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const map = mapRef.current;
      if (!map) return;
      map.invalidateSize();
      if (location) {
        map.panTo([location.latitude, location.longitude], { animate: false });
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [location]);

  return <div ref={containerRef} className="h-[520px] w-full rounded-lg overflow-hidden" />;
}

