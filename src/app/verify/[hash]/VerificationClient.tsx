"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    phone: string;
    relationship: string;
  }>;
}

interface VerificationClientProps {
  tourist: TouristData;
  isValid: boolean;
  isTripValid: boolean;
  verificationTimestamp: string;
}

export function VerificationClient({ 
  tourist, 
  isValid, 
  isTripValid, 
  verificationTimestamp 
}: VerificationClientProps) {
  const maskIdNumber = (idNumber: string) => {
    if (idNumber.length <= 4) return idNumber;
    return "XXXX-XXXX-" + idNumber.slice(-4);
  };

  const getStatusColor = () => {
    if (!isValid) return "bg-red-500";
    if (!isTripValid) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (!isValid) return "TAMPERED";
    if (!isTripValid) return "EXPIRED";
    return "VALID";
  };

  const getStatusDescription = () => {
    if (!isValid) return "This ID has been tampered with or is invalid. The digital fingerprint does not match.";
    if (!isTripValid) return "This ID was valid but the trip period has expired.";
    return "This is a valid Digital Tourist ID with authentic digital fingerprint.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital ID Verification</h1>
          <p className="text-gray-600">Official verification portal for tourist identification</p>
        </div>

        {/* Verification Status */}
        <Card className={`border-2 ${isValid && isTripValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isValid && isTripValid ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isValid && isTripValid ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{getStatusText()}</h2>
                  <p className="text-gray-600 mt-1">{getStatusDescription()}</p>
                </div>
              </div>
              <Badge className={`${getStatusColor()} text-white border-none text-lg px-4 py-2`}>
                {getStatusText()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tourist Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={tourist.photo_url || ""} alt={tourist.full_name} />
                  <AvatarFallback>
                    {tourist.full_name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{tourist.full_name}</h3>
                  <p className="text-gray-600">Foreign Tourist</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Type:</span>
                  <span className="font-medium">{tourist.id_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ID Number:</span>
                  <span className="font-mono font-medium">{maskIdNumber(tourist.id_number)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{tourist.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium">{tourist.preferred_language}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Trip Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination:</span>
                  <span className="font-medium">{tourist.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip Start:</span>
                  <span className="font-medium">{new Date(tourist.trip_start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip End:</span>
                  <span className="font-medium">{new Date(tourist.trip_end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={isTripValid ? "default" : "destructive"}>
                    {isTripValid ? "Active" : "Expired"}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Tourist ID</p>
                <p className="font-mono text-sm text-gray-600">{tourist.tourist_id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tourist.emergency_contacts.map((contact, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                  <p className="text-sm text-gray-600 mb-1">{contact.relationship}</p>
                  <p className="text-sm font-medium text-blue-600">{contact.phone}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Verification Timestamp</p>
                <p className="font-medium">{new Date(verificationTimestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Digital Fingerprint</p>
                <p className="font-mono text-sm text-gray-700 break-all">{tourist.digital_id_hash}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Verification Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>This Digital ID uses SHA-256 cryptographic hashing for tamper-proof verification</li>
                <li>The digital fingerprint is calculated from tourist ID, name, ID number, and trip dates</li>
                <li>Any modification to the original data will result in verification failure</li>
                <li>This verification portal is accessible to authorized personnel for official verification purposes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
