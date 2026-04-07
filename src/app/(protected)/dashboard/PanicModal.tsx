"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: { latitude: number; longitude: number; accuracy: number | null } | null;
  onTriggered?: () => void;
};

type Phase = "confirm" | "countdown" | "done";

export function PanicModal({ open, onOpenChange, currentLocation, onTriggered }: Props) {
  const [phase, setPhase] = React.useState<Phase>("confirm");
  const [seconds, setSeconds] = React.useState(3);
  const [isPosting, setIsPosting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setPhase("confirm");
      setSeconds(3);
      setIsPosting(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (phase !== "countdown") return;
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, seconds]);

  React.useEffect(() => {
    if (phase !== "countdown") return;
    if (seconds > 0) return;
    void trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, seconds]);

  async function trigger() {
    if (isPosting) return;
    if (!currentLocation) {
      toast.error("Waiting for GPS location…");
      setPhase("confirm");
      setSeconds(3);
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PANIC",
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          source: "app",
        }),
      });

      if (!res.ok) {
        toast.error("Failed to send panic alert.");
        setPhase("confirm");
        setSeconds(3);
        return;
      }

      setPhase("done");
      onTriggered?.();
    } catch {
      toast.error("Network error sending panic alert.");
      setPhase("confirm");
      setSeconds(3);
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] p-0 border-0 rounded-none">
        <div className="h-full w-full bg-red-600 text-white flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="font-semibold tracking-tight">Panic mode</div>
            <Button
              type="button"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
              disabled={phase === "countdown" || isPosting}
            >
              Close
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            {phase === "confirm" && (
              <>
                <div className="text-3xl font-semibold">Need help now?</div>
                <div className="mt-3 max-w-md text-white/90">
                  Press the button below. We’ll start a 3-second countdown before triggering.
                </div>
                <Button
                  type="button"
                  className={cn(
                    "mt-10 h-20 w-full max-w-sm text-xl font-semibold rounded-2xl",
                    "bg-white text-red-700 hover:bg-white/90",
                  )}
                  onClick={() => setPhase("countdown")}
                >
                  Trigger panic alert
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </>
            )}

            {phase === "countdown" && (
              <>
                <div className="text-2xl font-semibold">Sending in…</div>
                <div className="mt-6 text-8xl font-bold tabular-nums">{seconds}</div>
                <div className="mt-4 text-white/90">
                  Keep your phone steady for the most accurate location.
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-10 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setPhase("confirm");
                    setSeconds(3);
                  }}
                  disabled={isPosting}
                >
                  Cancel countdown
                </Button>
              </>
            )}

            {phase === "done" && (
              <>
                <div className="text-3xl font-semibold">Help is on the way</div>
                <div className="mt-3 max-w-md text-white/90">
                  Stay where you are if it’s safe. Keep your phone on and location enabled.
                </div>
                <Button
                  type="button"
                  className="mt-10 bg-white text-red-700 hover:bg-white/90"
                  onClick={() => onOpenChange(false)}
                >
                  Back to dashboard
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

