"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SMSLog = {
  id: string;
  alert_id: string;
  tourist_id: string;
  recipient_name: string;
  recipient_phone: string;
  message: string;
  sent_at: string;
  created_at: string;
};

export function AlertsClient() {
  const router = useRouter();
  const [alerts, setAlerts] = React.useState<AlertRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [selectedAlert, setSelectedAlert] = React.useState<AlertRow | null>(null);
  const [smsLogs, setSmsLogs] = React.useState<SMSLog[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const prevPanicCountRef = React.useRef(0);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/admin/alerts", { cache: "no-store" });
    const json = (await res.json()) as { ok: boolean; alerts?: AlertRow[] };
    if (!res.ok || !json.ok) return;
    const next = json.alerts ?? [];
    setAlerts(next);

    const panicCount = next.filter((a) => a.type === "PANIC" && a.status !== "RESOLVED").length;
    if (panicCount > prevPanicCountRef.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
    prevPanicCountRef.current = panicCount;
  }, []);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function markResolved(id: number) {
    const res = await fetch(`/api/admin/alerts/${id}/resolve`, { method: "POST" });
    const json = (await res.json()) as { ok: boolean };
    if (!res.ok || !json.ok) return toast.error("Failed to mark resolved.");
    toast.success("Marked resolved.");
    await load();
  }

  async function viewAlertDetails(alert: AlertRow) {
    setSelectedAlert(alert);
    setIsDetailModalOpen(true);

    // Load SMS logs for PANIC alerts
    if (alert.type === "PANIC") {
      try {
        const res = await fetch(`/api/admin/alerts/${alert.id}/sms-logs`);
        const json = (await res.json()) as { ok: boolean; smsLogs?: SMSLog[] };
        if (res.ok && json.ok) {
          setSmsLogs(json.smsLogs ?? []);
        }
      } catch (error) {
        console.error("Failed to load SMS logs:", error);
        setSmsLogs([]);
      }
    } else {
      setSmsLogs([]);
    }
  }

  function generateEFir(id: number) {
    router.push(`/admin/efir/${id}`);
  }

  const rows = alerts.filter((a) =>
    query
      ? `${a.tourist_name} ${a.type} ${a.message ?? ""}`.toLowerCase().includes(query.toLowerCase())
      : true,
  );

  return (
    <div className="px-6 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">All alerts</h1>
        <Input placeholder="Search alerts" className="max-w-xs" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="overflow-auto rounded-lg border bg-white dark:bg-black">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Tourist</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Message</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t align-top">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {a.tourist_photo ? (
                      <Image
                        src={a.tourist_photo}
                        alt=""
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted" />
                    )}
                    <span>{a.tourist_name}</span>
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={a.type === "PANIC" ? "destructive" : a.type === "GEO_BREACH" ? "secondary" : "default"}>{a.type}</Badge>
                </td>
                <td className="p-3">{a.message ?? "-"}</td>
                <td className="p-3">
                  <a
                    className="underline underline-offset-4"
                    href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View location
                  </a>
                </td>
                <td className="p-3">{new Date(a.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <Badge variant={a.status === "RESOLVED" ? "default" : "secondary"}>{a.status}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => void markResolved(a.id)}>
                      Mark Resolved
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(`/admin?focus=${a.clerk_user_id}`, "_blank")}
                    >
                      View on Map
                    </Button>
                    {a.type === "PANIC" && (
                      <Button type="button" variant="outline" onClick={() => void viewAlertDetails(a)}>
                        View Details
                      </Button>
                    )}
                    {(a.type === "PANIC" || a.type === "MISSING_PERSON") && (
                      <Button type="button" onClick={() => void generateEFir(a.id)}>
                        Generate E-FIR
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={7}>
                  No alerts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alert Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details - {selectedAlert?.type}</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tourist</Label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.tourist_name}</p>
                </div>
                <div>
                  <Label>Time</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedAlert.status === "RESOLVED" ? "default" : "secondary"}>
                    {selectedAlert.status}
                  </Badge>
                </div>
              </div>

              {selectedAlert.message && (
                <div>
                  <Label>Message</Label>
                  <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
                </div>
              )}

              {smsLogs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notifications Sent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {smsLogs.map((log, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{log.recipient_name}</p>
                              <p className="text-sm text-muted-foreground">{log.recipient_phone}</p>
                            </div>
                            <Badge variant="outline">SMS Sent</Badge>
                          </div>
                          <p className="text-sm mt-2 text-muted-foreground">
                            {new Date(log.sent_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

