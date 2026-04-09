import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

// Zod schemas for input validation
const AlertCreateSchema = z.object({
  type: z.enum(["sos", "panic", "fall", "low_battery", "geo_fence", "medical", "theft", "other"]),
  message: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(1000).nullable().optional(),
  source: z.enum(["app", "wearable", "web"]).default("app"),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers: securityHeaders });
  }

  const supabase = createSecureSupabaseClient(userId);
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
  }

  return NextResponse.json({ ok: true, alerts: data ?? [] }, { headers: securityHeaders });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers: securityHeaders });
  }

  try {
    const body = await request.json();
    const validation = AlertCreateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, reason: "invalid_input", details: validation.error.issues },
        { status: 400, headers: securityHeaders }
      );
    }

    const { type, message, latitude, longitude, accuracy, source } = validation.data;

    const supabase = createSecureSupabaseClient(userId);
    const { error } = await supabase.from("alerts").insert({
      clerk_user_id: userId,
      type,
      message,
      status: "OPEN",
      latitude,
      longitude,
      accuracy,
      source,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400, headers: securityHeaders }
    );
  }
}

