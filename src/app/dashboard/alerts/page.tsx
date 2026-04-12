"use client";

import { useTouristData } from "@/hooks/useTouristData";
import { AlertTriangle, Activity, MapPin, Clock, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function DashboardAlertsPage() {
  const { touristData, isLoading, isRedirecting, error } = useTouristData();

  if (isLoading || isRedirecting) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading alerts</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!touristData) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking your profile</h2>
          <p className="text-gray-600">Redirecting you to onboarding if needed...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Safety Alerts</h1>
            <p className="text-gray-600">View your safety alerts and emergency notifications</p>
          </div>

          {/* Alert Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">2</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                <Shield className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">85</div>
                <p className="text-xs text-muted-foreground">Good condition</p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Your safety alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample alerts - in real app, these would be fetched from Supabase */}
                <div className="flex items-start space-x-4 p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-red-800">SOS Alert Activated</p>
                      <Badge variant="destructive">Active</Badge>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Emergency alert triggered via wearable device. Emergency services have been notified.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-red-600">
                      <Clock className="h-3 w-3 mr-1" />
                      2 hours ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
                  <div className="flex-shrink-0">
                    <MapPin className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-yellow-800">Location Update</p>
                      <Badge variant="secondary">Info</Badge>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your location was updated successfully. GPS accuracy: ±5 meters.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-yellow-600">
                      <Clock className="h-3 w-3 mr-1" />
                      5 hours ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-800">Safe Zone Entered</p>
                      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You have entered a designated safe zone. Enhanced monitoring is active.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-green-600">
                      <Clock className="h-3 w-3 mr-1" />
                      1 day ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-800">Wearable Connected</p>
                      <Badge variant="secondary">Info</Badge>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Your safety wearable device is now connected and monitoring.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-blue-600">
                      <Clock className="h-3 w-3 mr-1" />
                      2 days ago
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 border-l-4 border-gray-500 bg-gray-50 rounded-r-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">Check-in Reminder</p>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      Daily safety check-in completed. All systems operational.
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      3 days ago
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
