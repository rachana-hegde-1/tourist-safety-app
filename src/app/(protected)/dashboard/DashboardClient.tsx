"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TouristMap = dynamic(() => import("./TouristMap"), {
  ssr: false,
});
import { PanicModal } from "./PanicModal";
import { DashboardLayout } from "@/components/DashboardLayout";

type AlertRow = {
  id?: string;
  type?: string;
  created_at?: string;
  latitude?: number;
  longitude?: number;
};

export function DashboardClient(props: {
  touristName: string;
  safetyScore: number;
  wearableConnected: boolean;
  wearableDeviceId?: string | null;
  initialAlerts: AlertRow[];
}) {
  const router = useRouter();
  const [alerts, setAlerts] = React.useState<AlertRow[]>(props.initialAlerts);
  const [panicOpen, setPanicOpen] = React.useState(false);
  const [shareLink, setShareLink] = React.useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = React.useState(false);
  const [currentLoc, setCurrentLoc] = React.useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp?: number;
  } | null>(null);

  const safetyVariant: "default" | "secondary" | "destructive" =
    props.safetyScore >= 80
      ? "default"
      : props.safetyScore >= 50
        ? "secondary"
        : "destructive";

  const safetyLabel =
    props.safetyScore >= 80 ? "Safe" : props.safetyScore >= 50 ? "Caution" : "Unsafe";

  const zoneStatus = props.safetyScore >= 50 ? "safe" : "unsafe";

  async function refreshAlerts() {
    try {
      const res = await fetch("/api/alerts");
      const json = (await res.json()) as { ok: boolean; alerts?: AlertRow[] };
      if (!res.ok || !json.ok) return;
      setAlerts(json.alerts ?? []);
    } catch {
      // ignore
    }
  }

  async function generateShareLink() {
    if (isGeneratingLink) return;
    setIsGeneratingLink(true);
    try {
      const res = await fetch("/api/tracking-links", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; token?: string };
      if (!res.ok || !json.ok || !json.token) {
        toast.error("Failed to generate tracking link.");
        return;
      }
      const url = `${window.location.origin}/track/${json.token}`;
      setShareLink(url);
      toast.success("Tracking link generated.");
    } catch {
      toast.error("Failed to generate tracking link.");
    } finally {
      setIsGeneratingLink(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied.");
  }

  function shareOnWhatsApp() {
    if (!shareLink) return;
    const text = `Live tourist tracking link: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-4">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl font-semibold tracking-tight">{props.touristName}</div>
            <Badge variant={safetyVariant}>
              {safetyLabel} • {props.safetyScore}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: props.wearableConnected ? "#16a34a" : "#9ca3af" }}
              />
              Wearable {props.wearableConnected ? "connected" : "not connected"}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refreshAlerts();
                toast.message("Refreshing…");
              }}
            >
              Refresh
            </Button>
            <Button type="button" onClick={() => void generateShareLink()} disabled={isGeneratingLink}>
              {isGeneratingLink ? "Generating..." : "Share my location"}
            </Button>
          </div>
        </div>

        {shareLink && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="text-sm font-medium">Shareable live tracking link</div>
              <div className="mt-1 text-xs text-muted-foreground break-all">{shareLink}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyShareLink}>
                  Copy link
                </Button>
                <Button type="button" onClick={shareOnWhatsApp}>
                  Share on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Main card with map */}
          <Card>
            <CardHeader>
              <CardTitle>Current location</CardTitle>
            </CardHeader>
            <CardContent>
              <TouristMap onLocation={setCurrentLoc} />
              <div className="mt-3 text-xs text-muted-foreground">
                Updates automatically. Last known:{" "}
                {currentLoc
                  ? `${currentLoc.latitude.toFixed(5)}, ${currentLoc.longitude.toFixed(5)}`
                  : "waiting for GPS…"}
              </div>
            </CardContent>
          </Card>

          {/* Side panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Current zone</div>
                <Badge variant={zoneStatus === "safe" ? "default" : "destructive"}>
                  {zoneStatus}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wearable status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{props.wearableConnected ? "Wearable linked" : "No wearable linked"}</p>
                    <p className="text-sm text-muted-foreground">
                      {props.wearableConnected
                        ? `Device ID: ${props.wearableDeviceId}`
                        : "Connect a wearable from settings to enable real-time tracking."}
                    </p>
                  </div>
                  <Badge variant={props.wearableConnected ? "default" : "secondary"}>
                    {props.wearableConnected ? "Connected" : "Not connected"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentLoc?.timestamp
                    ? `Last update: ${new Date(currentLoc.timestamp).toLocaleString()}`
                    : currentLoc
                      ? "Last update received"
                      : "Waiting for the latest location ping..."}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No alerts yet.</div>
                ) : (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((a, idx) => (
                      <div key={a.id ?? `${a.type}-${idx}`} className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{(a.type ?? "ALERT").toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.created_at ? (() => {
                              const raw = a.created_at;
                              const utc = raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z";
                              return new Date(utc).toLocaleString();
                            })() : "—"}
                          </div>
                        </div>
                        <Badge variant={a.type?.toUpperCase() === "PANIC" ? "destructive" : "secondary"}>
                          {(a.type ?? "ALERT").toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Panic</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-600/90 text-white"
                  onClick={() => setPanicOpen(true)}
                >
                  Open panic button
                </Button>
                <div className="mt-2 text-xs text-muted-foreground">
                  Use only in real emergencies.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PanicModal
        open={panicOpen}
        onOpenChange={setPanicOpen}
        currentLocation={currentLoc}
        onTriggered={() => void refreshAlerts()}
      />
    </DashboardLayout>
  );
}

