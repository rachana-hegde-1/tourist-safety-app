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

    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (touristError || !tourist) {
      return NextResponse.json({ ok: false, reason: "tourist_not_found" }, { status: 404, headers: securityHeaders });
    }

    const { error } = await supabase.from("locations").insert({
      tourist_id: tourist.id,
      latitude,
      longitude,
      accuracy,
      source,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
    }

    // --- AI Anomaly Detection Trigger ---
    try {
      const { data: recentLocations } = await supabase
        .from("locations")
        .select("*")
        .eq("tourist_id", tourist.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // We need at least a few points to detect an anomaly pattern
      if (recentLocations && recentLocations.length > 2) {
        // Fire asynchronously to not block the location POST response
        import("@/lib/anomaly-detection").then(({ analyzeLocationHistory }) => {
          analyzeLocationHistory(recentLocations).then(async (anomalyAnalysis) => {
            // Consider anomaly only if high confidence
            if (anomalyAnalysis && anomalyAnalysis.isAnomaly && anomalyAnalysis.confidence > 80) {
              await supabase.from("alerts").insert({
                clerk_user_id: userId,
                type: "panic",
                message: `AI Anomaly Detected: ${anomalyAnalysis.reason}`,
                status: "OPEN",
                latitude,
                longitude,
                source: source || "app",
                created_at: new Date().toISOString(),
              });
            }
          }).catch((err) => console.error("Error running async AI analysis", err));
        }).catch((err) => console.error("Failed to import anomaly-detection utility", err));
      }
    } catch (err) {
      console.error("Anomaly detection DB query failed", err);
    }
    // ------------------------------------

    return NextResponse.json({ ok: true, clerk_user_id: userId }, { headers: securityHeaders });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400, headers: securityHeaders }
    );
  }
}

