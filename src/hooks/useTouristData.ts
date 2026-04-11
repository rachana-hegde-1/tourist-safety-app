"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase";

interface TouristData {
  tourist_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  clerk_user_id: string;
  trip_start_date?: string;
  trip_end_date?: string;
  destination?: string;
  digital_id_qr?: string;
  safety_score?: number;
  device_id?: string;
  id_type?: string;
  digital_id_hash?: string;
  // Add other fields as needed
}

export function useTouristData() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [touristData, setTouristData] = useState<TouristData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchTouristData = async () => {
      try {
        const userId = user?.id;
        if (!userId) {
          router.push("/sign-in");
          return;
        }

        const supabase = createSupabaseAdminClient();
        const { data: tourist, error } = await supabase
          .from("tourists")
          .select("*")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching tourist data:", error);
          setError("Failed to fetch tourist data");
          setIsLoading(false);
          return;
        }

        if (!tourist) {
          // Tourist hasn't completed onboarding
          router.push("/onboarding");
          return;
        }

        setTouristData(tourist);
        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    };

    fetchTouristData();
  }, [isLoaded, isSignedIn, user, router]);

  return { touristData, isLoading, error };
}
