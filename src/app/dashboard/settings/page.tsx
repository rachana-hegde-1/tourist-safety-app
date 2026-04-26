"use client";

import { useTouristData } from "@/hooks/useTouristData";
import { useBluetoothWearable } from "@/hooks/useBluetoothWearable";
import { Settings, Users, Smartphone, Globe, Save, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface EmergencyContact {
  id?: number | string;
  name: string;
  phone: string;
  relationship: string;
}

interface ProfileData {
  full_name: string;
  phone_number: string;
  preferred_language: string;
  destination: string;
  trip_start: string;
  trip_end: string;
}

interface EmergencyContactResponse {
  id: string;
  name: string;
  phone_number: string;
  relationship: string;
}

const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Odia",
  "Assamese",
];

export default function DashboardSettingsPage() {
  const { touristData, isLoading, isRedirecting, error } = useTouristData();
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
  const [newContact, setNewContact] = useState<EmergencyContact>({ name: "", phone: "", relationship: "" });
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    phone_number: "",
    preferred_language: "",
    destination: "",
    trip_start: "",
    trip_end: "",
  });
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [linkedDeviceId, setLinkedDeviceId] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [verifyReason, setVerifyReason] = useState<string | null>(null);
  const [isLinkingDevice, setIsLinkingDevice] = useState(false);

  const {
    bleSupported,
    bleDeviceName,
    bleConnected,
    bleStatus,
    bleError,
    connectWearable,
    disconnectWearable,
  } = useBluetoothWearable();

  useEffect(() => {
    // Populate simple profile data immediately from the robust touristData hook
    if (touristData) {
      setProfileData({
        full_name: touristData.full_name || "",
        phone_number: touristData.phone_number || "",
        preferred_language: touristData.preferred_language || "English",
        destination: touristData.destination || "",
        trip_start: touristData.trip_start_date || "",
        trip_end: touristData.trip_end_date || "",
      });
      setLinkedDeviceId(touristData.device_id ?? null);
    }

    const fetchContacts = async () => {
      try {
        const response = await fetch("/api/tourist/profile");
        const json = await response.json();

        if (!response.ok || json.ok === false) {
          toast.error("Unable to load profile settings.", {
            style: { color: "white", backgroundColor: "#ef4444" }
          });
          return;
        }

        setProfileData({
          full_name: json.profile?.full_name || "",
          phone_number: json.profile?.phone_number || "",
          preferred_language: json.profile?.preferred_language || "English",
          destination: json.profile?.destination || "",
          trip_start: json.profile?.trip_start_date || "",
          trip_end: json.profile?.trip_end_date || "",
        });
        setLinkedDeviceId(json.profile?.device_id ?? null);
        setEmergencyContacts(
          (json.emergencyContacts ?? []).map((contact: EmergencyContactResponse) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone_number,
            relationship: contact.relationship,
          }))
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile settings.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
      }
    };

    fetchContacts();
  }, [touristData]);

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && newContact.relationship) {
      setEmergencyContacts([...emergencyContacts, { ...newContact, id: `${Date.now()}` }]);
      setNewContact({ name: "", phone: "", relationship: "" });
      setIsEditingContacts(false);
      toast.success("Emergency contact added locally.", {
        style: { color: "white", backgroundColor: "#22c55e" }
      });
    } else {
      toast.error("Please fill all contact fields", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    }
  };

  const handleRemoveContact = (id?: number | string) => {
    if (!id) return;
    setEmergencyContacts(emergencyContacts.filter(contact => contact.id !== id));
    toast.success("Emergency contact removed locally.", {
      style: { color: "white", backgroundColor: "#22c55e" }
    });
  };

  const handleSaveEmergencyContacts = async () => {
    setIsUpdatingContacts(true);

    try {
      const response = await fetch("/api/emergency-contacts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: emergencyContacts.map((contact) => ({
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
          })),
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        toast.error(json.error || "Failed to save emergency contacts.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
        return;
      }

      toast.success("Settings saved successfully", {
        style: { color: "white", backgroundColor: "#22c55e" }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save emergency contacts.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    } finally {
      setIsUpdatingContacts(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);

    if (!profileData.full_name || !profileData.phone_number || !profileData.preferred_language) {
      toast.error("Full name, phone number, and language are required.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const response = await fetch("/api/tourists/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profileData.full_name,
          phone: profileData.phone_number,
          destination: profileData.destination,
          trip_start: profileData.trip_start,
          trip_end: profileData.trip_end,
          preferred_language: profileData.preferred_language,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        toast.error(json.error || "Failed to save profile settings.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
        return;
      }

      toast.success("Settings saved successfully", {
        style: { color: "white", backgroundColor: "#22c55e" }
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const verifyDevice = async () => {
    const trimmedDeviceId = deviceIdInput.trim();
    if (!trimmedDeviceId) {
      toast.error("Enter a device ID to verify.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
      return;
    }

    setVerifyStatus("checking");
    setVerifyReason(null);

    try {
      const res = await fetch(`/api/wearable/verify?deviceId=${encodeURIComponent(trimmedDeviceId)}`);
      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setVerifyStatus("unavailable");
        setVerifyReason(json.reason ?? "verification_failed");
        toast.error("Wearable verification failed.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
        return;
      }

      if (json.available) {
        setVerifyStatus("available");
        toast.success("Wearable is available for linking.", {
          style: { color: "white", backgroundColor: "#22c55e" }
        });
      } else {
        setVerifyStatus("unavailable");
        setVerifyReason(json.reason ?? "unavailable");
        toast.error("This wearable cannot be linked.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
      }
    } catch {
      setVerifyStatus("unavailable");
      setVerifyReason("network_error");
      toast.error("Failed to verify wearable.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    }
  };

  const linkDevice = async () => {
    const trimmedDeviceId = deviceIdInput.trim();
    if (!trimmedDeviceId) {
      toast.error("Enter a device ID to link.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
      return;
    }

    setIsLinkingDevice(true);
    try {
      const res = await fetch("/api/wearable/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: trimmedDeviceId }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        toast.error(json.error || "Failed to link wearable device.", {
          style: { color: "white", backgroundColor: "#ef4444" }
        });
        return;
      }

      setLinkedDeviceId(trimmedDeviceId);
      setVerifyStatus("available");
      toast.success("Settings saved successfully", {
        style: { color: "white", backgroundColor: "#22c55e" }
      });
    } catch (error) {
      console.error("Link device error:", error);
      toast.error("Unable to link wearable device.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    } finally {
      setIsLinkingDevice(false);
    }
  };

  const handleConnectBluetooth = async () => {
    if (!bleSupported) {
      toast.error("Bluetooth is not supported by this browser.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
      return;
    }

    try {
      const deviceId = await connectWearable();
      setDeviceIdInput(deviceId);
      setVerifyStatus("idle");
      setVerifyReason(null);
      toast.success("Wearable discovered via Bluetooth.", {
        style: { color: "white", backgroundColor: "#22c55e" }
      });
    } catch {
      toast.error("Failed to connect via Bluetooth.", {
        style: { color: "white", backgroundColor: "#ef4444" }
      });
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading settings</h2>
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
            <Settings className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your profile, emergency contacts, and preferences</p>
          </div>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Primary Destination</Label>
                  <Input
                    id="destination"
                    value={profileData.destination}
                    onChange={(e) => setProfileData({ ...profileData, destination: e.target.value })}
                    placeholder="e.g. New Delhi, Goa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="tripStart">Trip Start</Label>
                    <Input
                      id="tripStart"
                      type="date"
                      value={profileData.trip_start}
                      onChange={(e) => setProfileData({ ...profileData, trip_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tripEnd">Trip End</Label>
                    <Input
                      id="tripEnd"
                      type="date"
                      value={profileData.trip_end}
                      onChange={(e) => setProfileData({ ...profileData, trip_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select
                  value={profileData.preferred_language || "English"}
                  onValueChange={(value) => {
                    if (value) setProfileData({ ...profileData, preferred_language: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdatingProfile ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Emergency Contacts
                </div>
                <Dialog open={isEditingContacts} onOpenChange={setIsEditingContacts}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Emergency Contact</DialogTitle>
                      <DialogDescription>
                        Add a new emergency contact for safety notifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Name</Label>
                        <Input
                          id="contactName"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Phone Number</Label>
                        <Input
                          id="contactPhone"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactRelationship">Relationship</Label>
                        <Input
                          id="contactRelationship"
                          value={newContact.relationship}
                          onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                          placeholder="e.g., Parent, Spouse, Friend"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditingContacts(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddContact}>
                        Add Contact
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Manage your emergency contacts who will be notified in case of an emergency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emergencyContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No emergency contacts added yet</p>
                    <p className="text-sm">Add at least one emergency contact for your safety</p>
                  </div>
                ) : (
                  emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                        <Badge variant="secondary" className="mt-1">
                          {contact.relationship}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => contact.id && handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
                {emergencyContacts.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleSaveEmergencyContacts} 
                      disabled={isUpdatingContacts}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdatingContacts ? "Saving..." : "Save Contacts"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Wearable Device Status
              </CardTitle>
              <CardDescription>
                Check the status of your linked safety wearable device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${linkedDeviceId ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <div>
                      <p className="font-medium">
                        {linkedDeviceId ? "Device linked" : "No device linked"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {linkedDeviceId ? `Device ID: ${linkedDeviceId}` : "Link a wearable to enable location updates."}
                      </p>
                    </div>
                  </div>
                  <Badge variant={linkedDeviceId ? "default" : "secondary"}>
                    {linkedDeviceId ? "Linked" : "Not linked"}
                  </Badge>
                </div>

                {bleSupported && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm font-medium">Bluetooth Connection</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleConnectBluetooth}
                        disabled={bleStatus === "scanning" || bleStatus === "connecting"}
                      >
                        {bleStatus === "scanning"
                          ? "Scanning..."
                          : bleStatus === "connecting"
                          ? "Connecting..."
                          : bleConnected
                          ? "Bluetooth connected"
                          : "Connect wearable by Bluetooth"}
                      </Button>
                      {bleConnected && (
                        <Button type="button" variant="secondary" onClick={disconnectWearable}>
                          Disconnect Bluetooth
                        </Button>
                      )}
                    </div>
                    {bleDeviceName && (
                      <p className="text-sm text-gray-600">
                        Connected via Bluetooth: {bleDeviceName}
                      </p>
                    )}
                    {bleStatus === "error" && bleError && (
                      <p className="text-sm text-red-700">Bluetooth error: {bleError}</p>
                    )}
                  </div>
                )}
                {!bleSupported && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-gray-600">
                      Your browser does not currently support Web Bluetooth. Use a compatible browser such as Chrome on Android or Edge/Chrome on desktop.
                    </p>
                  </div>
                )}

                {!linkedDeviceId && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="deviceId">Wearable Device ID</Label>
                      <Input
                        id="deviceId"
                        value={deviceIdInput}
                        onChange={(e) => {
                          setDeviceIdInput(e.target.value);
                          setVerifyStatus("idle");
                          setVerifyReason(null);
                        }}
                        placeholder="Enter your wearable device ID"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={verifyDevice}
                        disabled={verifyStatus === "checking" || !deviceIdInput.trim()}
                      >
                        {verifyStatus === "checking" ? "Verifying..." : "Verify device"}
                      </Button>
                      {verifyStatus === "available" && (
                        <Button
                          type="button"
                          onClick={linkDevice}
                          disabled={isLinkingDevice}
                        >
                          {isLinkingDevice ? "Linking..." : "Link wearable"}
                        </Button>
                      )}
                    </div>
                    {verifyStatus === "available" && (
                      <div className="text-sm text-green-700">Device is available and ready to link.</div>
                    )}
                    {verifyStatus === "unavailable" && (
                      <div className="text-sm text-red-700">
                        Unable to verify device{verifyReason ? `: ${verifyReason}` : "."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Configure your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appLanguage">App Language</Label>
                  <Select defaultValue={profileData.preferred_language}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select app language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="Asia/Kolkata">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
