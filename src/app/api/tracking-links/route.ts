import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    
    // Verify tourist exists
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("clerk_user_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (touristError || !tourist) {
      return NextResponse.json({ error: "Tourist profile not found" }, { status: 404 });
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;

    const { error: insertError } = await supabase.from("tracking_links").insert({
      tourist_id: userId,
      token,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      active: true,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token,
      url: `${appUrl}/track/${token}`,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
