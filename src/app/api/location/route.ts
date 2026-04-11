import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

// Zod schemas for input validation
const LocationCreateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1000).nullable().optional(),
  source: z.enum(["app", "wearable", "web"]).default("app"),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers: securityHeaders });
  }

  try {
    const body = await request.json();
    const validation = LocationCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, reason: "invalid_input", details: validation.error.issues },
        { status: 400, headers: securityHeaders }
      );
    }

    const { latitude, longitude, accuracy, source } = validation.data;

    const supabase = createSecureSupabaseClient(userId);
    const { error } = await supabase.from("locations").insert({
      clerk_user_id: userId,
      latitude,
      longitude,
      accuracy,
      source,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
    }

    return NextResponse.json({ ok: true, clerk_user_id: userId }, { headers: securityHeaders });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400, headers: securityHeaders }
    );
  }
}

