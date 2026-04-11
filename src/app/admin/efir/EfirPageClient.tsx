"use client";

import * as React from "react";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EfirDraft = {
  alert_id: string;
  case_number?: string;
  report_datetime?: string;
  tourist_full_name?: string;
  tourist_id_type?: string;
  tourist_id_number?: string;
  last_known_lat?: string;
  last_known_lng?: string;
  alert_type?: string;
  alert_description?: string;
  itinerary?: { destination?: string };
  last_gps_signal_at?: string;
  admin_notes?: string;
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EfirPageClient({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<EfirDraft | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/alerts/${encodeURIComponent(alertId)}/efir-data`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok || !json.efir) {
          toast.error("Failed to load E-FIR draft.");
          return;
        }
        setDraft(json.efir);
      })
      .catch(() => toast.error("Failed to load E-FIR draft."))
      .finally(() => setIsLoading(false));
  }, [alertId]);

  function downloadPdf() {
    if (!draft) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 50;

    doc.setFontSize(14);
    doc.text("Tourist Safety Monitoring System - Official Incident Report", margin, y);
    y += 26;

    doc.setFontSize(11);
    const lines = [
      ["Case number", draft.case_number],
      ["Report date", draft.report_datetime],
      ["Tourist", draft.tourist_full_name ?? "-"],
      ["ID type", draft.tourist_id_type ?? "-"],
      ["ID number", draft.tourist_id_number ?? "-"],
      ["Last known location", `${draft.last_known_lat ?? ""}, ${draft.last_known_lng ?? ""}`],
      ["Alert type", draft.alert_type ?? "-"],
      ["Alert description", draft.alert_description ?? "-"],
    ];

    for (const [label, value] of lines) {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${value ?? "-"}`, margin + 140, y);
      y += 20;
      if (y > 760) {
        doc.addPage();
        y = 50;
      }
    }

    doc.save(`efir-${draft.alert_id}.pdf`);
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
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error("Failed to save E-FIR.");
        return;
      }
      toast.success("E-FIR saved.");
      router.push("/admin/alerts");
    } catch {
      toast.error("Failed to save E-FIR.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="px-6 pb-8">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Generate E-FIR</h1>
          <p className="text-sm text-muted-foreground">Review and save the pre-filled incident report.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={downloadPdf} disabled={!draft || isLoading}>
            Download PDF
          </Button>
          <Button type="button" onClick={saveEfir} disabled={!draft || isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save E-FIR"}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-10 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-72 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      )}

      {!isLoading && !draft && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load E-FIR data. Please go back to alerts.
        </div>
      )}

      {draft && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident report details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <Label>Case number</Label>
                  <Input value={draft.case_number} readOnly />
                </div>
                <div>
                  <Label>Report date</Label>
                  <Input
                    value={draft.report_datetime}
                    onChange={(e) => setDraft((d) => (d ? { ...d, report_datetime: e.target.value } : d))}
                  />
                </div>
                <div>
                  <Label>Tourist full name</Label>
                  <Input
                    value={draft.tourist_full_name ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, tourist_full_name: e.target.value } : d))}
                  />
                </div>
                <div>
                  <Label>Alert type</Label>
                  <Input value={draft.alert_type ?? ""} readOnly />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>ID type</Label>
                  <Input
                    value={draft.tourist_id_type ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, tourist_id_type: e.target.value } : d))}
                  />
                </div>
                <div>
                  <Label>ID number</Label>
                  <Input
                    value={draft.tourist_id_number ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, tourist_id_number: e.target.value } : d))}
                  />
                </div>
                <div>
                  <Label>Last known location</Label>
                  <Input value={`${draft.last_known_lat ?? ""}, ${draft.last_known_lng ?? ""}`} readOnly />
                </div>
                <div>
                  <Label>Last GPS signal</Label>
                  <Input value={draft.last_gps_signal_at ?? ""} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details & notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label>Alert description</Label>
                  <Input
                    value={draft.alert_description ?? ""}
                    onChange={(e) => setDraft((d) => (d ? { ...d, alert_description: e.target.value } : d))}
                  />
                </div>
                <div>
                  <Label>Tourist destination</Label>
                  <Input
                    value={draft.itinerary?.destination ?? ""}
                    onChange={(e) =>
                      setDraft((d) => (d ? {
                        ...d,
                        itinerary: { ...d.itinerary, destination: e.target.value },
                      } : d))
                    }
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Admin notes</Label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500"
                  value={draft.admin_notes ?? ""}
                  onChange={(e) => setDraft((d) => d ? { ...d, admin_notes: e.target.value } : d)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
