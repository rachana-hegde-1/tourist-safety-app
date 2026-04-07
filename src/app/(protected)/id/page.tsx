import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { DigitalIDClient } from "./DigitalIDClient";

export default async function DigitalIDPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const supabase = createSupabaseAdminClient();

  const { data: tourist, error } = await supabase
    .from("tourists")
    .select(`
      *,
      emergency_contacts(name, phone_number, relationship)
    `)
    .eq("clerk_user_id", userId)
    .single();

  if (error || !tourist) {
    redirect("/onboarding");
  }

  if (!tourist.digital_id_hash || !tourist.digital_id_qr) {
    redirect("/onboarding");
  }

  return <DigitalIDClient tourist={tourist} />;
}
