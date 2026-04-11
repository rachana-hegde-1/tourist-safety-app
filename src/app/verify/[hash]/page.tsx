import crypto from "crypto";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { VerificationClient } from "./VerificationClient";

interface VerifyPageProps {
  params: {
    hash: string;
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { hash } = params;

  if (!hash || hash.length !== 64) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();

  // Find tourist by digital ID hash
  const { data: tourist, error } = await supabase
    .from("tourists")
    .select(`
      *,
      emergency_contacts(name, phone_number, relationship)
    `)
    .eq("digital_id_hash", hash)
    .single();

  if (error || !tourist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid ID</h1>
          <p className="text-gray-600">This digital ID could not be found in our system. Please verify the QR code or contact the issuing authority.</p>
        </div>
      </div>
    );
  }

  // Verify the hash integrity by recalculating it
  function sha256Hex(input: string) {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
  }

  const hashInput = JSON.stringify({
    tourist_id: tourist.tourist_id,
    full_name: tourist.full_name,
    id_number: tourist.id_number,
    trip_start: tourist.trip_start_date,
    trip_end: tourist.trip_end_date
  });

  const calculatedHash = sha256Hex(hashInput);
  const isValid = calculatedHash === hash;

  // Check if trip is still valid
  const endDate = new Date(tourist.trip_end_date);
  const today = new Date();
  const isTripValid = endDate >= today;

  return (
    <VerificationClient 
      tourist={tourist} 
      isValid={isValid}
      isTripValid={isTripValid}
      verificationTimestamp={new Date().toISOString()}
    />
  );
}
