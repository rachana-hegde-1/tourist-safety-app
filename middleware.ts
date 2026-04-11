import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export default clerkMiddleware(async (auth, req) => {
  const authState = await auth();
  const { pathname } = req.nextUrl;
  const userId = authState.userId;

  if (!userId) {
    return;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/onboarding") {
    const supabase = createSupabaseAdminClient();
    const { data: tourist, error } = await supabase
      .from("tourists")
      .select("onboarding_completed")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Onboarding check failed:", error);
      return;
    }

    const completed = tourist?.onboarding_completed;
    if (!completed && pathname === "/dashboard") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }

    if (completed && pathname === "/onboarding") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/id/:path*",
    "/settings/:path*",
  ],
};
