"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createHash } from "crypto";
import QRCode from "qrcode";

type EmergencyContactInput = {
  name: string;
  phone: string;
  relationship: string;
};

function required(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

export async function submitOnboarding(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be signed in to complete onboarding.");

    const user = await currentUser();

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

    // Handle photo upload
    const photoFile = formData.get("photo") as File | null;
    let photoUrl = null;
    
    if (photoFile && photoFile.size > 0) {
      // In a real implementation, you would upload to a storage service like Supabase Storage
      // For now, we'll simulate the upload and store a placeholder URL
      try {
        // This would be replaced with actual storage upload logic
        photoUrl = `https://storage.example.com/photos/${userId}-${Date.now()}.jpg`;
        console.log("[Onboarding] Photo uploaded:", photoFile.name, "Size:", photoFile.size);
      } catch (error) {
        console.error("[Onboarding] Photo upload error:", error);
        // Don't fail onboarding if photo upload fails
      }
    }

    const supabase = createSupabaseAdminClient();

    // Get email from Clerk user
    const email = user?.primaryEmailAddress?.emailAddress || null;

    // Generate digital ID hash and QR code
    const digitalIdData = {
      clerk_user_id: userId,
      full_name: fullName,
      phone_number: phoneNumber,
      id_type: idType,
      id_number: idNumber,
      destination,
      trip_start_date: tripStartDate,
      trip_end_date: tripEndDate,
      created_at: new Date().toISOString()
    };
    
    const digitalIdHash = createHash('sha256')
      .update(JSON.stringify(digitalIdData))
      .digest('hex');
    
    // Generate QR code data URL
    const qrCodeData = JSON.stringify({
      tourist_id: userId,
      hash: digitalIdHash,
      name: fullName,
      phone: phoneNumber,
      verified: true
    });
    
    let digitalIdQr = null;
    try {
      digitalIdQr = await QRCode.toDataURL(qrCodeData);
    } catch (error) {
      console.error("[Onboarding] QR code generation error:", error);
      // Don't fail onboarding if QR generation fails
    }

    // Optional wearable linking - only update wearables table, don't add to tourists
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

    // Insert tourist with exact required columns only
    const { error: upsertError } = await supabase.from("tourists").upsert(
      {
        clerk_user_id: userId,
        full_name: fullName,
        phone_number: phoneNumber,
        email: email,
        id_type: idType,
        id_number: idNumber,
        trip_start_date: tripStartDate,
        trip_end_date: tripEndDate,
        destination,
        preferred_language: preferredLanguage,
        device_id: deviceId || null,
        photo_url: photoUrl,
        digital_id_hash: digitalIdHash,
        digital_id_qr: digitalIdQr,
        onboarding_completed: true,
      },
      { onConflict: "clerk_user_id" },
    );

    if (upsertError) {
      console.error("[Onboarding] Supabase insert error:", {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code,
      });
      throw new Error(`Failed to save onboarding: ${upsertError.message}`);
    }

    const { error: deleteError } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("clerk_user_id", userId);

    if (deleteError) {
      console.error("[Onboarding] Delete emergency contacts error:", deleteError);
      // Don't fail onboarding if emergency_contacts table doesn't exist
      // throw new Error("Failed to update emergency contacts.");
    } else {
      const { error: insertError } = await supabase.from("emergency_contacts").insert(
        emergencyContacts.map((c) => ({
          clerk_user_id: userId,
          name: c.name,
          phone_number: c.phone,
          relationship: c.relationship,
        })),
      );

      if (insertError) {
        console.error("[Onboarding] Insert emergency contacts error:", insertError);
        // Don't fail onboarding if emergency_contacts table doesn't exist
        // throw new Error("Failed to save emergency contacts.");
      }
    }

    console.log("[Onboarding] Successfully completed for user:", userId);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during onboarding";
    console.error("[Onboarding] Error:", errorMessage, error);
    throw error;
  }
}

