"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { createSupabaseAdminClient } from "@/lib/supabase";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
          return;
        }

        if (!tourist) {
          // Tourist hasn't completed onboarding
          router.push("/onboarding");
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setIsLoading(false);
      }
    };

    fetchTouristData();
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading skeleton while fetching data
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar skeleton */}
        <div className="w-64 bg-white border-r border-gray-200 hidden lg:block">
          <div className="p-6 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="h-12 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation */}
      <DashboardNav />

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
