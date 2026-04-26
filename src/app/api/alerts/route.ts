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
  // Find the tourist.id corresponding to this clerk user
  const { data: tourist } = await supabase
    .from("tourists")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!tourist) {
    return NextResponse.json({ ok: false, reason: "tourist_not_found" }, { status: 404, headers: securityHeaders });
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("tourist_id", tourist.id)
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

    const { type, message, latitude, longitude } = validation.data;

    const supabase = createSecureSupabaseClient(userId);
    const { data: tourist } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!tourist) {
      return NextResponse.json({ ok: false, reason: "tourist_not_found" }, { status: 404, headers: securityHeaders });
    }

    const { error } = await supabase.from("alerts").insert({
      tourist_id: tourist.id,
      type,
      message,
      latitude,
      longitude,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
    }

    return NextResponse.json({ ok: true }, { headers: securityHeaders });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400, headers: securityHeaders }
    );
  }
}

