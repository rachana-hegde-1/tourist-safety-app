import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { DashboardClient } from "./DashboardClient";

type TouristRow = {
  full_name: string | null;
  safety_score: number | null;
  device_id: string | null;
};

type AlertRow = {
  id: string;
  type: string;
  created_at: string;
  latitude: number | undefined;
  longitude: number | undefined;
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createSupabaseAdminClient();

  const { data: touristData } = await supabase
    .from("tourists")
    .select("full_name, safety_score, device_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  const { data: alertsData } = await supabase
    .from("alerts")
    .select("id,type,created_at,latitude,longitude")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const tourist = touristData as unknown as TouristRow | null;
  const alerts = (alertsData ?? []) as unknown as AlertRow[];

  const touristName = tourist?.full_name ?? "Tourist";
  const safetyScore = typeof tourist?.safety_score === "number" ? tourist.safety_score : 80;
  const wearableConnected = Boolean(tourist?.device_id);

  return (
    <DashboardClient
      touristName={touristName}
      safetyScore={safetyScore}
      wearableConnected={wearableConnected}
      initialAlerts={alerts}
    />
  );
}

