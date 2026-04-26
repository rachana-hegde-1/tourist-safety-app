"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SOSAlert {
  id: string;
  type: string;
  message: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export function useSOSPolling(enabled: boolean = true, intervalMs: number = 4000) {
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const lastSeenAlertId = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play siren sound
  const playSiren = useCallback(() => {
    try {
      if (!audioRef.current) {
        // Use Web Audio API to generate a siren tone (no external file needed)
        const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
        const ctx = new AudioContext();
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        
        // Create siren effect — oscillate between 800Hz and 1200Hz
        const now = ctx.currentTime;
        for (let i = 0; i < 60; i++) {
          oscillator.frequency.setValueAtTime(800, now + i * 0.5);
          oscillator.frequency.linearRampToValueAtTime(1200, now + i * 0.5 + 0.25);
          oscillator.frequency.linearRampToValueAtTime(800, now + i * 0.5 + 0.5);
        }
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        
        // Store context for cleanup
        audioRef.current = { ctx, oscillator, gainNode } as unknown as HTMLAudioElement;
      }
    } catch (e) {
      console.warn("Could not play siren:", e);
    }
  }, []);

  // Stop siren
  const stopSiren = useCallback(() => {
    try {
      if (audioRef.current) {
        const audio = audioRef.current as unknown as { ctx: AudioContext; oscillator: OscillatorNode };
        audio.oscillator?.stop();
        audio.ctx?.close();
        audioRef.current = null;
      }
    } catch (e) {
      console.warn("Could not stop siren:", e);
    }
  }, []);

  // Dismiss the alert
  const dismissAlert = useCallback(async () => {
    if (activeAlert) {
      lastSeenAlertId.current = activeAlert.id;
      setActiveAlert(null);
      stopSiren();
    }
  }, [activeAlert, stopSiren]);

  // Poll for new SOS alerts
  useEffect(() => {
    if (!enabled) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        setIsPolling(true);
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.alerts && json.alerts.length > 0) {
            // Look for PANIC type alerts that we haven't dismissed yet
            const panicAlert = json.alerts.find(
              (a: SOSAlert) =>
                (a.type === "PANIC" || a.type === "SOS") &&
                a.id !== lastSeenAlertId.current
            );

            if (panicAlert && panicAlert.id !== activeAlert?.id) {
              // Check if the alert is recent (within the last 5 minutes)
              const alertTime = new Date(panicAlert.created_at).getTime();
              const now = Date.now();
              const fiveMinutes = 5 * 60 * 1000;

              if (now - alertTime < fiveMinutes) {
                setActiveAlert(panicAlert);
                playSiren();
              }
            }
          }
        }
      } catch (e) {
        console.warn("SOS poll failed:", e);
      } finally {
        setIsPolling(false);
        timeoutId = setTimeout(poll, intervalMs);
      }
    };

    poll();

    return () => {
      clearTimeout(timeoutId);
      stopSiren();
    };
  }, [enabled, intervalMs, activeAlert?.id, playSiren, stopSiren]);

  return {
    activeAlert,
    isPolling,
    dismissAlert,
    stopSiren,
  };
}
