import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

const EmergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Phone number must be at least 5 characters"),
  relationship: z.string().min(1, "Relationship is required"),
});

const UpdateEmergencyContactsSchema = z.object({
  contacts: z.array(EmergencyContactSchema).min(0, "Contacts array is required"),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        ok: false, 
        error: "Unauthorized - Please log in" 
      }, { status: 401, headers: securityHeaders });
    }

    const body = await request.json();
    const parseResult = UpdateEmergencyContactsSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({
        ok: false,
        error: "Invalid input data",
        details: parseResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400, headers: securityHeaders });
    }

    const { contacts } = parseResult.data;
    const supabase = createSecureSupabaseClient(userId);

    const { data: tourist, error: touristError } = await supabase
      .from("tourists")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (touristError || !tourist) {
      return NextResponse.json({
        ok: false,
        error: "Tourist profile not found"
      }, { status: 404, headers: securityHeaders });
    }

    // Delete all existing emergency contacts for this user
    const { error: deleteError } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("tourist_id", tourist.id);

    if (deleteError) {
      console.error("Delete emergency contacts error:", deleteError);
      return NextResponse.json({
        ok: false,
        error: "Failed to update emergency contacts - Please try again"
      }, { status: 500, headers: securityHeaders });
    }

    if (contacts.length > 0) {
      const formattedContacts = contacts.map((contact) => ({
        tourist_id: tourist.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
      }));

      const { error: insertError } = await supabase
        .from("emergency_contacts")
        .insert(formattedContacts);

      if (insertError) {
        console.error("Insert emergency contacts error:", insertError);
        return NextResponse.json({
          ok: false,
          error: "Failed to save emergency contacts - Please try again"
        }, { status: 500, headers: securityHeaders });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Emergency contacts updated successfully",
      contactsCount: contacts.length
    }, { headers: securityHeaders });

  } catch (error) {
    console.error("Update emergency contacts error:", error);
    return NextResponse.json({
      ok: false,
      error: "Internal server error - Please try again"
    }, { status: 500, headers: securityHeaders });
  }
}
