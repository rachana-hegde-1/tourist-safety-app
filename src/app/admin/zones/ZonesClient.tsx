"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Zone = {
  id: number;
  name: string;
  type: "Safe" | "Unsafe";
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  active: boolean;
  created_at?: string;
};

type DraftZone = {
  name: string;
  type: "Safe" | "Unsafe";
  radius_meters: string;
  center_lat: number;
  center_lng: number;
};

export function ZonesClient() {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const circleLayersRef = React.useRef<L.LayerGroup | null>(null);
  const previewCircleRef = React.useRef<L.Circle | null>(null);

  const [zones, setZones] = React.useState<Zone[]>([]);
  const [draft, setDraft] = React.useState<DraftZone | null>(null);
  const [editingZoneId, setEditingZoneId] = React.useState<number | null>(null);

  async function loadZones() {
    const res = await fetch("/api/zones", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; zones?: Zone[] };
    if (!res.ok || !json.ok) return;
    setZones(json.zones ?? []);
  }

  React.useEffect(() => {
    void loadZones();
  }, []);

  React.useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const circles = L.layerGroup().addTo(map);
    circleLayersRef.current = circles;

    map.on("click", (e: L.LeafletMouseEvent) => {
      setDraft({
        name: "",
        type: "Safe",
        radius_meters: "200",
        center_lat: e.latlng.lat,
        center_lng: e.latlng.lng,
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !circleLayersRef.current) return;
    circleLayersRef.current.clearLayers();

    zones.forEach((z) => {
      L.circle([z.center_lat, z.center_lng], {
        radius: z.radius_meters,
        color: z.type === "Unsafe" ? "#dc2626" : "#16a34a",
        fillOpacity: 0.15,
      })
        .bindPopup(`${z.name} (${z.type})`)
        .addTo(circleLayersRef.current!);
    });
  }, [zones]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (previewCircleRef.current) {
      previewCircleRef.current.remove();
      previewCircleRef.current = null;
    }
    if (!draft) return;

    const radius = Number(draft.radius_meters);
    if (!Number.isFinite(radius) || radius <= 0) return;
    previewCircleRef.current = L.circle([draft.center_lat, draft.center_lng], {
      radius,
      color: draft.type === "Unsafe" ? "#dc2626" : "#16a34a",
      fillOpacity: 0.2,
      dashArray: "5,5",
    }).addTo(map);
  }, [draft]);

  async function saveZone() {
    if (!draft) return;
    const radius = Number(draft.radius_meters);
    if (!draft.name.trim()) return toast.error("Zone name is required.");
    if (!Number.isFinite(radius) || radius <= 0) return toast.error("Radius must be valid.");

    const payload = {
      name: draft.name.trim(),
      type: draft.type,
      center_lat: draft.center_lat,
      center_lng: draft.center_lng,
      radius_meters: radius,
      active: true,
    };

    const res =
      editingZoneId === null
        ? await fetch("/api/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/zones/${editingZoneId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    const json = (await res.json()) as { ok: boolean };
    if (!res.ok || !json.ok) return toast.error("Failed to save zone.");

    toast.success(editingZoneId === null ? "Zone created." : "Zone updated.");
    setDraft(null);
    setEditingZoneId(null);
    await loadZones();
  }

  function startEdit(z: Zone) {
    setEditingZoneId(z.id);
    setDraft({
      name: z.name,
      type: z.type,
      radius_meters: String(z.radius_meters),
      center_lat: z.center_lat,
      center_lng: z.center_lng,
    });
    mapRef.current?.setView([z.center_lat, z.center_lng], 15);
  }

  async function deleteZone(zoneId: number) {
    const res = await fetch(`/api/zones/${zoneId}`, { method: "DELETE" });
    const json = (await res.json()) as { ok: boolean };
    if (!res.ok || !json.ok) return toast.error("Failed to delete zone.");
    toast.success("Zone deleted.");
    await loadZones();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Zone management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={mapContainerRef} className="h-[480px] w-full rounded-lg overflow-hidden" />
            <div className="text-xs text-muted-foreground">
              Click the map to place a zone, then fill the form and save.
            </div>

            <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingZoneId === null ? "Create zone" : "Edit zone"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Zone name</Label>
                  <Input
                    value={draft?.name ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                    placeholder="e.g. Downtown Restricted Zone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={draft?.type ?? "Safe"}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, type: v as "Safe" | "Unsafe" } : d))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safe">Safe</SelectItem>
                      <SelectItem value="Unsafe">Unsafe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={draft?.radius_meters ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, radius_meters: e.target.value } : d))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Center</Label>
                  <Input
                    value={
                      draft ? `${draft.center_lat.toFixed(6)}, ${draft.center_lng.toFixed(6)}` : ""
                    }
                    readOnly
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="button" onClick={() => void saveZone()}>
                    {editingZoneId === null ? "Save zone" : "Update zone"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(null);
                      setEditingZoneId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {zones.length === 0 && <div className="text-sm text-muted-foreground">No zones yet.</div>}
              {zones.map((z) => (
                <div key={z.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{z.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {z.center_lat.toFixed(5)}, {z.center_lng.toFixed(5)} • {z.radius_meters}m
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={z.type === "Unsafe" ? "destructive" : "default"}>{z.type}</Badge>
                    <Button type="button" variant="outline" onClick={() => startEdit(z)}>
                      Edit
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void deleteZone(z.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

