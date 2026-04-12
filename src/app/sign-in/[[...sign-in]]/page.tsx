"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const redirectUrl = params.get("redirect") ?? "/onboarding";

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
    if (role === "admin" || role === "police") {
      router.push("/admin");
      return;
    }

    router.push(redirectUrl);
  }, [isLoaded, isSignedIn, user, redirectUrl, router]);

  return (
    <div className="min-h-[calc(100vh-0px)] w-full flex items-center justify-center p-6 bg-background">
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
