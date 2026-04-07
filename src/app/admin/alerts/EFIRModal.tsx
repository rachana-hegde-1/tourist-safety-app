"use client";

import * as React from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EmergencyContact = {
  name?: string;
  phone_number?: string;
  relationship?: string;
  email?: string;
};

type EfirDraft = {
  case_number: string;
  report_datetime: string;

  alert_id: number;
  tourist_id: string;

  tourist_full_name: string | null;
  tourist_nationality: string | null;
  tourist_id_type: string | null;
  tourist_id_number: string | null;

  last_known_lat: number | null;
  last_known_lng: number | null;
  last_known_maps_url: string | null;

  last_gps_signal_at: string | null;
  last_wearable_signal_at: string | null;

  alert_type: string | null;
  alert_description: string | null;

  emergency_contacts: EmergencyContact[];
  itinerary: {
    destination: string | null;
    trip_start_date: string | null;
    trip_end_date: string | null;
  };

  admin_notes: string;
};

export function EFIRModal({
  open,
  onOpenChange,
  alertId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertId: number | null;
}) {
  const [draft, setDraft] = React.useState<EfirDraft | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !alertId) {
      setDraft(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/admin/alerts/${alertId}/efir-data`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { ok: boolean; efir?: EfirDraft }) => {
        if (!json.ok || !json.efir) {
          toast.error("Failed to load E-FIR data.");
          return;
        }
        setDraft(json.efir);
      })
      .catch(() => toast.error("Failed to load E-FIR data."))
      .finally(() => setIsLoading(false));
  }, [open, alertId]);

  function downloadPdf() {
    if (!draft) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Tourist Safety Monitoring System - Official Incident Report", margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines: Array<[string, string]> = [
      ["Case number", draft.case_number],
      ["Date & time of report", draft.report_datetime],
      ["Tourist full name", draft.tourist_full_name ?? ""],
      ["Nationality", draft.tourist_nationality ?? ""],
      ["ID type", draft.tourist_id_type ?? ""],
      ["ID number", draft.tourist_id_number ?? ""],
      [
        "Last known location",
        `${draft.last_known_lat ?? ""}, ${draft.last_known_lng ?? ""}`,
      ],
      ["Google Maps link", draft.last_known_maps_url ?? ""],
      ["Time of last GPS signal", draft.last_gps_signal_at ?? ""],
      ["Time of last wearable signal", draft.last_wearable_signal_at ?? ""],
      ["Alert type", draft.alert_type ?? ""],
      ["Alert description", draft.alert_description ?? ""],
      [
        "Itinerary",
        `${draft.itinerary.destination ?? ""} (${draft.itinerary.trip_start_date ?? ""} → ${
          draft.itinerary.trip_end_date ?? ""
        })`,
      ],
    ];

    const wrap = (text: string, width: number) => doc.splitTextToSize(text, width) as string[];
    const labelWidth = 160;
    const valueWidth = 360;

    for (const [label, value] of lines) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      const vLines = wrap(value || "-", valueWidth);
      doc.text(vLines, margin + labelWidth, y);
      y += Math.max(16, vLines.length * 14);
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
    }

    doc.setFont("helvetica", "bold");
    doc.text("Emergency contacts:", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    const contactsText =
      draft.emergency_contacts.length === 0
        ? ["-"]
        : draft.emergency_contacts.map(
            (c, i) =>
              `${i + 1}. ${c.name ?? "-"} (${c.relationship ?? "-"}) • ${c.phone_number ?? "-"} • ${
                c.email ?? "-"
              }`,
          );
    for (const line of contactsText) {
      const vLines = wrap(line, 520);
      doc.text(vLines, margin, y);
      y += vLines.length * 14;
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
    }

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Admin notes:", margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    const noteLines = wrap(draft.admin_notes || "-", 520);
    doc.text(noteLines, margin, y);

    doc.save(`${draft.case_number}.pdf`);
  }

  async function saveEfir() {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/efirs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ efir: draft }),
      });
      const json = (await res.json()) as { ok: boolean };
      if (!res.ok || !json.ok) {
        toast.error("Failed to save E-FIR.");
        return;
      }
      toast.success("E-FIR saved.");
    } catch {
      toast.error("Failed to save E-FIR.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] p-0 border-0 rounded-none">
        <div className="h-full w-full bg-background overflow-auto">
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold tracking-tight">E-FIR generation</div>
              <div className="text-xs text-muted-foreground">
                Tourist Safety Monitoring System - Official Incident Report
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={downloadPdf} disabled={!draft || isLoading}>
                Download as PDF
              </Button>
              <Button type="button" onClick={() => void saveEfir()} disabled={!draft || isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save E-FIR"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>

          <div className="px-6 py-6">
            {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {!isLoading && !draft && (
              <div className="text-sm text-muted-foreground">Unable to load E-FIR draft.</div>
            )}

            {draft && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Report details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Case number</Label>
                        <Input value={draft.case_number} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Date and time of report</Label>
                        <Input
                          value={draft.report_datetime}
                          onChange={(e) => setDraft((d) => (d ? { ...d, report_datetime: e.target.value } : d))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tourist full name</Label>
                        <Input
                          value={draft.tourist_full_name ?? ""}
                          onChange={(e) =>
                            setDraft((d) => (d ? { ...d, tourist_full_name: e.target.value } : d))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Input
                          value={draft.tourist_nationality ?? ""}
                          onChange={(e) =>
                            setDraft((d) => (d ? { ...d, tourist_nationality: e.target.value } : d))
                          }
                          placeholder="e.g. Indian"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ID type</Label>
                        <Input value={draft.tourist_id_type ?? ""} onChange={(e) =>
                          setDraft((d) => (d ? { ...d, tourist_id_type: e.target.value } : d))
                        } />
                      </div>
                      <div className="space-y-2">
                        <Label>ID number</Label>
                        <Input value={draft.tourist_id_number ?? ""} onChange={(e) =>
                          setDraft((d) => (d ? { ...d, tourist_id_number: e.target.value } : d))
                        } />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Last known location</Label>
                      <Input
                        value={`${draft.last_known_lat ?? ""}, ${draft.last_known_lng ?? ""}`}
                        readOnly
                      />
                      {draft.last_known_maps_url && (
                        <a
                          className="text-sm underline underline-offset-4"
                          href={draft.last_known_maps_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Google Maps
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Time of last GPS signal</Label>
                        <Input value={draft.last_gps_signal_at ?? ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Time of last wearable signal</Label>
                        <Input value={draft.last_wearable_signal_at ?? ""} readOnly />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Alert type</Label>
                        <Input value={draft.alert_type ?? ""} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Alert description</Label>
                        <Input
                          value={draft.alert_description ?? ""}
                          onChange={(e) =>
                            setDraft((d) => (d ? { ...d, alert_description: e.target.value } : d))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Emergency contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {draft.emergency_contacts.length === 0 ? (
                        <div className="text-muted-foreground">No contacts found.</div>
                      ) : (
                        draft.emergency_contacts.map((c, idx) => (
                          <div key={idx} className="rounded border p-2">
                            <div className="font-medium">{c.name ?? "-"}</div>
                            <div className="text-muted-foreground">
                              {c.relationship ?? "-"} • {c.phone_number ?? "-"}
                            </div>
                            {c.email && <div className="text-muted-foreground">{c.email}</div>}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Travel itinerary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>Destination: {draft.itinerary.destination ?? "-"}</div>
                      <div>
                        Trip dates: {(draft.itinerary.trip_start_date ?? "-") + " → " + (draft.itinerary.trip_end_date ?? "-")}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Admin notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="w-full min-h-40 rounded-md border bg-background p-3 text-sm"
                        value={draft.admin_notes}
                        onChange={(e) => setDraft((d) => (d ? { ...d, admin_notes: e.target.value } : d))}
                        placeholder="Add notes for the official report..."
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

