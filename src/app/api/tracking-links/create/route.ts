import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Verify tourist exists and get their UUID 'id'
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (touristError || !tourist) {
      return NextResponse.json({ error: "Tourist profile not found. Please complete onboarding first." }, { status: 404 });
    }

    const touristId = tourist.id;

    // Generate a random 32-character token
    const token = crypto.randomUUID().replace(/-/g, "");
    
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Use environment variable for base URL, fallback to request origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;

    const { error: insertError } = await supabase.from("tracking_links").insert({
      tourist_id: touristId,
      token,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      active: true,
    });

    if (insertError) {
      console.error("Tracking_links Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token,
      url: `${appUrl}/track/${token}`,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Unexpected error in tracking-links/create:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
