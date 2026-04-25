import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSecureSupabaseClient, securityHeaders } from "@/lib/secure-db";

const UpdateProfileSchema = z.object({
  full_name: z.string().min(1),
  phone_number: z.string().min(5),
  preferred_language: z.string().min(1),
  emergency_contacts: z.array(
    z.object({
      name: z.string().min(1),
      phone_number: z.string().min(5),
      relationship: z.string().min(1),
      id: z.string().optional(),
    })
  ),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers: securityHeaders });
  }

  const supabase = createSecureSupabaseClient(userId);
  const [{ data: tourist, error: touristError }, { data: contacts, error: contactsError }] = await Promise.all([
    supabase
      .from("tourists")
      .select("full_name, phone_number, preferred_language, device_id, destination, trip_start_date, trip_end_date, digital_id_hash, digital_id_qr")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    supabase
      .from("emergency_contacts")
      .select("id, name, phone_number, relationship")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (touristError || contactsError) {
    return NextResponse.json(
      { ok: false, reason: "db_error" },
      { status: 500, headers: securityHeaders }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      profile: tourist ?? null,
      emergencyContacts: contacts ?? [],
    },
    { headers: securityHeaders }
  );
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401, headers: securityHeaders });
  }

  const body = await request.json();
  const parseResult = UpdateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_input", details: parseResult.error.issues },
      { status: 400, headers: securityHeaders }
    );
  }

  const { full_name, phone_number, preferred_language, emergency_contacts } = parseResult.data;
  
  // Generate new digital ID hash and QR code since personal info might have changed
  const digitalIdData = {
    clerk_user_id: userId,
    full_name,
    phone_number,
    updated_at: new Date().toISOString()
  };
  
  const { createHash } = await import("node:crypto");
  const digitalIdHash = createHash('sha256')
    .update(JSON.stringify(digitalIdData))
    .digest('hex');
  
  const qrCodeData = JSON.stringify({
    tourist_id: userId,
    hash: digitalIdHash,
    name: full_name,
    phone: phone_number,
    verified: true
  });
  
  const QRCode = await import("qrcode");
  let digitalIdQr = null;
  try {
    digitalIdQr = await QRCode.toDataURL(qrCodeData);
  } catch (qrError) {
    console.error("QR generation error in profile PATCH:", qrError);
  }

  const supabase = createSecureSupabaseClient(userId);

  const { error: touristError } = await supabase
    .from("tourists")
    .update({ 
      full_name, 
      phone_number, 
      preferred_language, 
      digital_id_hash: digitalIdHash,
      digital_id_qr: digitalIdQr,
      updated_at: new Date().toISOString() 
    })
    .eq("clerk_user_id", userId);

  if (touristError) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
  }

  const { error: deleteError } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("clerk_user_id", userId);

  if (deleteError) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
  }

  const formattedContacts = emergency_contacts.map((contact) => ({
    clerk_user_id: userId,
    name: contact.name,
    phone_number: contact.phone_number,
    relationship: contact.relationship,
  }));

  const { error: insertError } = await supabase.from("emergency_contacts").insert(formattedContacts);
  if (insertError) {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500, headers: securityHeaders });
  }

  return NextResponse.json({ ok: true }, { headers: securityHeaders });
}
