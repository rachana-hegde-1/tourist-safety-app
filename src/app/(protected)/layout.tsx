import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tourists")
    .select("onboarding_completed")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    // If DB is misconfigured, keep user unblocked from app rendering.
    // (They'll still see errors when attempting data-dependent actions.)
    return children;
  }

  if (!data?.onboarding_completed) {
    redirect("/onboarding");
  }

  return children;
}

