"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import html2canvas from "html2canvas";

interface TouristData {
  tourist_id: string;
  full_name: string;
  phone_number: string;
  id_type: string;
  id_number: string;
  photo_url: string | null;
  destination: string;
  trip_start_date: string;
  trip_end_date: string;
  preferred_language: string;
  digital_id_hash: string;
  digital_id_qr: string;
  emergency_contacts: Array<{
    name: string;
    phone_number: string;
    relationship: string;
  }>;
}

interface DigitalIDClientProps {
  tourist: TouristData;
}

export function DigitalIDClient({ tourist }: DigitalIDClientProps) {
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const maskIdNumber = (idNumber: string) => {
    if (idNumber.length <= 4) return idNumber;
    return "XXXX-XXXX-" + idNumber.slice(-4);
  };

  const calculateDaysRemaining = () => {
    const endDate = new Date(tourist.trip_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const downloadIDCard = async () => {
    if (!idCardRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(idCardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `digital-id-${tourist.full_name.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Error downloading ID card:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Tourist ID</h1>
          <p className="text-gray-600">Your official digital identification card</p>
        </div>

        {/* ID Card */}
        <div ref={idCardRef} className="relative">
          <Card className="overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-8">
              {/* Header with verified badge */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">DIGITAL TOURIST ID</h2>
                    <p className="text-blue-100 text-sm">Government of India</p>
                  </div>
                </div>
                <Badge className="bg-green-500 text-white border-green-400">
                  VERIFIED
                </Badge>
              </div>

              {/* Main content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side - Photo and basic info */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 border-4 border-white/30">
                      <AvatarImage src={tourist.photo_url || ""} alt={tourist.full_name} />
                      <AvatarFallback className="bg-white/20 text-2xl">
                        {tourist.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Full Name</p>
                      <p className="font-semibold text-lg">{tourist.full_name}</p>
                    </div>

                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Nationality</p>
                      <p className="font-semibold">Foreign Tourist</p>
                    </div>

                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">ID Number</p>
                      <p className="font-mono font-semibold">{maskIdNumber(tourist.id_number)}</p>
                    </div>
                  </div>
                </div>

                {/* Right side - QR code and trip info */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-lg">
                      <img 
                        src={tourist.digital_id_qr} 
                        alt="QR Code" 
                        className="w-32 h-32"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Destination</p>
                      <p className="font-semibold">{tourist.destination}</p>
                    </div>

                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Trip Validity</p>
                      <p className="font-semibold text-sm">
                        {new Date(tourist.trip_start_date).toLocaleDateString()} - {new Date(tourist.trip_end_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-blue-100 text-xs uppercase tracking-wide">Emergency Contact</p>
                      <p className="font-semibold text-sm">
                        {tourist.emergency_contacts[0]?.name}: {tourist.emergency_contacts[0]?.phone_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital hash at bottom */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs text-blue-100">Digital Fingerprint</p>
                <p className="text-xs font-mono text-blue-200 break-all">
                  {tourist.digital_id_hash}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons and info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">ID Status</h3>
                <p className="text-sm text-gray-600">
                  Valid for <span className="font-bold text-blue-600">{daysRemaining}</span> more days
                </p>
              </div>
              <Button 
                onClick={downloadIDCard}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDownloading ? "Generating..." : "Download ID Card"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-700">Tourist ID</p>
                <p className="text-gray-600 font-mono text-xs">{tourist.tourist_id.slice(0, 8)}...</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-700">Verification Hash</p>
                <p className="text-gray-600 font-mono text-xs">SHA-256 Encrypted</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-700">Emergency Contact</p>
                <p className="text-gray-600">{tourist.emergency_contacts.length} contacts</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to use your Digital ID</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>Present this ID card to authorities when requested</li>
                <li>The QR code can be scanned for instant verification</li>
                <li>The digital fingerprint ensures authenticity and prevents tampering</li>
                <li>Download and save a copy for offline access</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
