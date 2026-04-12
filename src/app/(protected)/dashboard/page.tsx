"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardClient } from "./DashboardClient";
import { useTouristData } from "@/hooks/useTouristData";
import { AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { touristData, isLoading, isRedirecting, error } = useTouristData();

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
  const wearableConnected = Boolean(touristData.device_id);
  const wearableDeviceId = touristData.device_id ?? null;

  return (
    <DashboardClient
      touristName={touristName}
      safetyScore={safetyScore}
      wearableConnected={wearableConnected}
      wearableDeviceId={wearableDeviceId}
      initialAlerts={[]}
    />
  );
}

