"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardClient } from "./DashboardClient";
import { useTouristData } from "@/hooks/useTouristData";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function DashboardPage() {
  const { touristData, isLoading, isRedirecting, error } = useTouristData();

  // Fetch real connection status from the wearables table
  // Hooks MUST be called before any early returns (React rules of hooks)
  const [wearableConnected, setWearableConnected] = useState(false);
  const wearableDeviceId = touristData?.device_id ?? null;

  useEffect(() => {
    if (!wearableDeviceId) {
      setWearableConnected(false);
      return;
    }

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase
          .from("wearables")
          .select("is_connected")
          .eq("device_id", wearableDeviceId)
          .maybeSingle();

        if (!cancelled) {
          setWearableConnected(Boolean(data?.is_connected));
        }
      } catch {
        // ignore — will retry on next interval
      }
    };

    fetchStatus();
    // Poll every 30 seconds to keep status fresh
    const interval = setInterval(fetchStatus, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [wearableDeviceId]);

  if (isLoading || isRedirecting) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="h-[420px] bg-gray-200 rounded animate-pulse" />
            <div className="space-y-6">
              <div className="h-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-28 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Unable to load your dashboard</h2>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!touristData) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto py-12 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Checking your profile</h2>
          <p className="mt-2 text-gray-600">Redirecting you to onboarding if needed...</p>
        </div>
      </DashboardLayout>
    );
  }

  const touristName = touristData.full_name ?? "Tourist";
  const safetyScore = typeof touristData.safety_score === "number" ? touristData.safety_score : 80;
  const wearableLinked = Boolean(touristData.device_id);

  return (
    <DashboardClient
      touristName={touristName}
      safetyScore={safetyScore}
      wearableLinked={wearableLinked}
      wearableConnected={wearableConnected}
      wearableDeviceId={wearableDeviceId}
      initialAlerts={[]}
    />
  );
}
