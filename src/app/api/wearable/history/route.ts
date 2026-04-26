import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Get the tourist UUID
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (touristError || !tourist) {
      return NextResponse.json({ ok: false, error: "Tourist not found" }, { status: 404 });
    }

    // Get all wearables linked to this tourist
    const { data: wearables, error: wearablesError } = await supabase
      .from("wearables")
      .select("*")
      .eq("tourist_id", tourist.id)
      .order("created_at", { ascending: false });

    if (wearablesError) {
      console.error("Wearable history error:", wearablesError);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: wearables });
  } catch (error) {
    console.error("Wearable history API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
