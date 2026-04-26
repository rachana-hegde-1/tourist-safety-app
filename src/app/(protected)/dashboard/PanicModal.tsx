"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
  onTriggered?: () => void;
};

type Phase = "confirm" | "countdown" | "done";

export function PanicModal({ open, onOpenChange, currentLocation, onTriggered }: Props) {
  // const [phase, setPhase] = React.useState<Phase>("confirm");
  // const [seconds, setSeconds] = React.useState(3);
  const [isPosting, setIsPosting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      // setPhase("confirm");
      // setSeconds(3);
      setIsPosting(false);
    }
  }, [open]);

  // React.useEffect(() => {
  //   if (phase !== "countdown") return;
  //   if (seconds <= 0) return;
  //   const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
  //   return () => window.clearTimeout(id);
  // }, [phase, seconds]);

  // React.useEffect(() => {
  //   if (phase !== "countdown") return;
  //   if (seconds > 0) return;
  //   // No need for trigger() or phase/seconds in this simplified modal
  // }, [phase, seconds]);

  async function handlePanicConfirm() {
    if (isPosting) return;
    if (!currentLocation) {
      toast.error("Waiting for GPS location…");
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "panic",
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          source: "app",
        }),
      });

      if (!res.ok) {
        toast.error("Failed to send panic alert.");
        return;
      }

      onOpenChange(false);
      onTriggered?.();
      toast.success("Panic alert sent!");
    } catch {
      toast.error("Network error sending panic alert.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 text-xl">Emergency SOS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to trigger a panic alert? This will notify police and your emergency contacts immediately.</p>
          <div className="h-48 w-full rounded-lg overflow-hidden">
            {/* map showing current location */}
            {currentLocation ? (
              <iframe
                src={`https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                Getting current location...
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isPosting}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={handlePanicConfirm} disabled={isPosting}>Send SOS Alert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
