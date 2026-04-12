"use client";

import { useTouristData } from "@/hooks/useTouristData";
import { CreditCard, User, MapPin, Calendar, Phone, Shield, Download, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import Image from "next/image";

export default function DigitalIdPage() {
  const { touristData, isLoading, isRedirecting, error } = useTouristData();
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const handleDownloadQR = async () => {
    setIsGeneratingQR(true);
    try {
      // In a real app, this would generate and download the QR code
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate download
      const link = document.createElement('a');
      link.download = 'aegistrack-digital-id.png';
      link.href = touristData?.digital_id_qr || '';
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleShareQR = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Aegistrack Digital ID',
          text: 'My Aegistrack Digital ID for emergency verification',
          url: window.location.href
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading Digital ID</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!touristData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking your profile</h2>
            <p className="text-gray-600">Redirecting you to onboarding if needed...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Tourist ID</h1>
            <p className="text-gray-600">Your official digital identification for tourism and emergency services</p>
          </div>

          {/* Digital ID Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8" />
                  <div>
                    <h2 className="text-xl font-bold">Aegistrack Digital ID</h2>
                    <p className="text-blue-100">Official Tourist Identification</p>
                  </div>
                </div>
                <Badge className="bg-white text-blue-600">Verified</Badge>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left side - Personal Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{touristData.full_name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium">{touristData.phone_number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">ID Type</p>
                          <p className="font-medium">{touristData.id_type || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Destination</p>
                          <p className="font-medium">{touristData.destination || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Travel Period</p>
                          <p className="font-medium">
                            {touristData.trip_start_date && touristData.trip_end_date 
                              ? `${new Date(touristData.trip_start_date).toLocaleDateString()} - ${new Date(touristData.trip_end_date).toLocaleDateString()}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 font-medium">Primary Emergency Contact</p>
                      <p className="text-red-700">Contact emergency services for verification</p>
                    </div>
                  </div>
                </div>

                {/* Right side - QR Code */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification QR Code</h3>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
                      {touristData.digital_id_qr ? (
                        <Image 
                          src={touristData.digital_id_qr} 
                          alt="Digital ID QR Code" 
                          width={192}
                          height={192}
                          className="w-48 h-48 mx-auto mb-4"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <CreditCard className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mb-4">
                        Scan this QR code for instant verification
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Tourist ID: {touristData.tourist_id?.substring(0, 8)}...</p>
                        <p>Hash: {touristData.digital_id_hash?.substring(0, 16)}...</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleDownloadQR}
                      disabled={isGeneratingQR}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingQR ? 'Generating...' : 'Download QR'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleShareQR}
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share ID
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use Your Digital ID</CardTitle>
              <CardDescription>Present this ID for tourism services and emergency verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">Tourism Services</h4>
                  <p className="text-sm text-gray-600">
                    Show your digital ID at hotels, attractions, and transportation services
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">Emergency Verification</h4>
                  <p className="text-sm text-gray-600">
                    Emergency services can scan your QR code for instant verification
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">Location Tracking</h4>
                  <p className="text-sm text-gray-600">
                    Linked with your wearable device for real-time safety monitoring
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
