import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

const UpdateTouristSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  destination: z.string().optional(),
  trip_start: z.string().optional(),
  trip_end: z.string().optional(),
  preferred_language: z.string().min(1, "Preferred language is required"),
});

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Unauthorized - Please log in" 
      }, { status: 401, headers: securityHeaders });
    }

    const body = await request.json();
    const parseResult = UpdateTouristSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input data",
        details: parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400, headers: securityHeaders });
    }

    const { full_name, phone, destination, trip_start, trip_end, preferred_language } = parseResult.data;
    const supabase = createSecureSupabaseClient(userId);

    // Update tourist profile
    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .update({ 
        full_name, 
        phone_number: phone,
        destination,
        trip_start_date: trip_start,
        trip_end_date: trip_end,
        preferred_language,
        updated_at: new Date().toISOString() 
      })
      .eq("clerk_user_id", userId)
      .select()
      .single();

    if (touristError) {
      console.error("Tourist update error:", touristError);
      return NextResponse.json({
        ok: false,
        error: "Failed to update profile - Please try again"
      }, { status: 500, headers: securityHeaders });
    }

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      tourist
    }, { headers: securityHeaders });

  } catch (error) {
    console.error("Update tourist error:", error);
    return NextResponse.json({
      ok: false,
      error: "Internal server error - Please try again"
    }, { status: 500, headers: securityHeaders });
  }
}
