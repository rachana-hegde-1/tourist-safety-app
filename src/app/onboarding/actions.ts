"use server";

import crypto from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import QRCode from "qrcode";

type EmergencyContactInput = {
  name: string;
  phone: string;
  relationship: string;
};

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function required(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

export async function submitOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must be signed in to complete onboarding.");

  const fullName = required(formData, "fullName");
  const phoneNumber = required(formData, "phoneNumber");
  const idType = required(formData, "idType");
  const idNumber = required(formData, "idNumber");

  const destination = required(formData, "destination");
  const tripStartDate = required(formData, "tripStartDate");
  const tripEndDate = required(formData, "tripEndDate");
  const preferredLanguage = required(formData, "preferredLanguage");

  const emergencyContactsRaw = required(formData, "emergencyContacts");
  const emergencyContacts = JSON.parse(
    emergencyContactsRaw,
  ) as EmergencyContactInput[];

  if (!Array.isArray(emergencyContacts) || emergencyContacts.length < 1) {
    throw new Error("At least 1 emergency contact is required.");
  }
  if (emergencyContacts.length > 3) {
    throw new Error("You can add up to 3 emergency contacts.");
  }

  const deviceIdRaw = formData.get("deviceId");
  const deviceId =
    typeof deviceIdRaw === "string" ? deviceIdRaw.trim() : undefined;

  const supabase = createSupabaseAdminClient();

  let photoPath: string | null = null;
  let photoUrl: string | null = null;

  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    photoPath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const upload = await supabase.storage
      .from("tourist-photos")
      .upload(photoPath, buffer, {
        contentType: photo.type || "application/octet-stream",
        upsert: true,
      });

    if (upload.error) {
      throw new Error(`Photo upload failed: ${upload.error.message}`);
    }

    const publicUrl = supabase.storage
      .from("tourist-photos")
      .getPublicUrl(photoPath).data.publicUrl;

    photoUrl = publicUrl ?? null;
  }

  // Generate tourist_id first
  const touristId = crypto.randomUUID();
  
  // Generate digital ID hash using the specified format
  const hashInput = JSON.stringify({
    tourist_id: touristId,
    full_name: fullName,
    id_number: idNumber,
    trip_start: tripStartDate,
    trip_end: tripEndDate
  });
  const digitalIdHash = sha256Hex(hashInput);

  // Generate QR code with tourist information
  const qrData = JSON.stringify({
    tourist_id: touristId,
    full_name: fullName,
    digital_id_hash: digitalIdHash,
    trip_start: tripStartDate,
    trip_end: tripEndDate,
    emergency_contact_phone: emergencyContacts[0]?.phone || ""
  });
  
  const qrCodeBase64 = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });

  // Optional wearable linking
  if (deviceId) {
    const { data: wearable, error: wearableError } = await supabase
      .from("wearables")
      .select("device_id, linked_user_id")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (wearableError) {
      throw new Error("Wearable verification failed.");
    }
    if (!wearable) {
      throw new Error("Wearable device ID not found.");
    }
    if (wearable.linked_user_id) {
      throw new Error("Wearable device is already linked.");
    }

    const { error: linkError } = await supabase
      .from("wearables")
      .update({ linked_user_id: userId })
      .eq("device_id", deviceId);

    if (linkError) {
      throw new Error("Failed to link wearable device.");
    }
  }

  const { error: upsertError } = await supabase.from("tourists").upsert(
    {
      clerk_user_id: userId,
      tourist_id: touristId,
      full_name: fullName,
      phone_number: phoneNumber,
      id_type: idType,
      id_number: idNumber,
      photo_path: photoPath,
      photo_url: photoUrl,
      destination,
      trip_start_date: tripStartDate,
      trip_end_date: tripEndDate,
      preferred_language: preferredLanguage,
      device_id: deviceId ?? null,
      digital_id_hash: digitalIdHash,
      digital_id_qr: qrCodeBase64,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_user_id" },
  );

  if (upsertError) {
    throw new Error(`Failed to save onboarding: ${upsertError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("clerk_user_id", userId);

  if (deleteError) {
    throw new Error("Failed to update emergency contacts.");
  }

  const { error: insertError } = await supabase.from("emergency_contacts").insert(
    emergencyContacts.map((c) => ({
      clerk_user_id: userId,
      name: c.name,
      phone_number: c.phone,
      relationship: c.relationship,
    })),
  );

  if (insertError) {
    throw new Error("Failed to save emergency contacts.");
  }

  return { success: true };
}

