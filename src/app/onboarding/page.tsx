"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { submitOnboarding } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

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
] as const;

function onlyDigitsPhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const userId = user?.id;
  const [step, setStep] = React.useState<"1" | "2" | "3" | "4">("1");
  const [isSubmitting, startSubmit] = React.useTransition();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [idType, setIdType] = React.useState("");
  const [idNumber, setIdNumber] = React.useState("");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState<string | null>(null);
  const [destination, setDestination] = React.useState("");
  const [tripStartDate, setTripStartDate] = React.useState("");
  const [tripEndDate, setTripEndDate] = React.useState("");
  const [preferredLanguage, setPreferredLanguage] = React.useState<(typeof LANGUAGES)[number] | "">("");
  const [contacts, setContacts] = React.useState<EmergencyContact[]>([]);
  const [contactDraft, setContactDraft] = React.useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });
  const [isContactDialogOpen, setIsContactDialogOpen] = React.useState(false);
  const [deviceId, setDeviceId] = React.useState("");
  const [wearableStatus, setWearableStatus] = React.useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [wearableReason, setWearableReason] = React.useState<string | null>(null);

  // Check if user has already completed onboarding
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      return;
    }

    const checkOnboardingStatus = async () => {
      setIsCheckingOnboarding(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const { data: tourist, error } = await supabase
          .from("tourists")
          .select("onboarding_completed")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error checking onboarding status:", error);
          setIsCheckingOnboarding(false);
          return;
        }

        if (tourist?.onboarding_completed) {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, isSignedIn, userId, router]);

  React.useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  // Show loading state while checking onboarding status
  if (!isLoaded || isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking onboarding status...</p>
        </div>
      </div>
    );
  }

  // If user is not signed in, redirect to sign-in
  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  // Step 1

  function goNext() {
    if (step === "1") {
      if (!fullName.trim()) return toast.error("Full name is required.");
      if (fullName.trim().length < 2) return toast.error("Full name must be at least 2 characters.");
      if (!phoneNumber.trim()) return toast.error("Phone number is required.");
      if (phoneNumber.trim().length < 10) return toast.error("Please enter a valid phone number.");
      if (!idType) return toast.error("ID type is required.");
      if (!idNumber.trim()) return toast.error("ID number is required.");
      if (idNumber.trim().length < 4) return toast.error("Please enter a valid ID number.");
      setStep("2");
      return;
    }
    if (step === "2") {
      if (!destination.trim()) return toast.error("Destination is required.");
      if (destination.trim().length < 2) return toast.error("Please enter a valid destination.");
      if (!tripStartDate) return toast.error("Trip start date is required.");
      if (!tripEndDate) return toast.error("Trip end date is required.");
      if (new Date(tripEndDate) < new Date(tripStartDate)) {
        return toast.error("Trip end date must be after start date.");
      }
      if (new Date(tripStartDate).getTime() < new Date().setHours(0,0,0,0)) {
        return toast.error("Trip start date cannot be in the past.");
      }
      if (!preferredLanguage) return toast.error("Preferred language is required.");
      setStep("3");
      return;
    }
    if (step === "3") {
      if (contacts.length < 1) return toast.error("Add at least 1 emergency contact to proceed.");
      setStep("4");
      return;
    }
  }

  function goBack() {
    if (step === "2") return setStep("1");
    if (step === "3") return setStep("2");
    if (step === "4") return setStep("3");
  }

  async function verifyWearable() {
    const trimmed = deviceId.trim();
    if (!trimmed) return;
    setWearableStatus("checking");
    setWearableReason(null);
    try {
      const res = await fetch(`/api/wearable/verify?deviceId=${encodeURIComponent(trimmed)}`);
      const json = (await res.json()) as
        | { ok: true; available: true }
        | { ok: true; available: false; reason?: string }
        | { ok: false; available: false; reason?: string };

      if (!res.ok || !json.ok) {
        setWearableStatus("unavailable");
        setWearableReason("verification_failed");
        toast.error("Could not verify device ID. Try again.");
        return;
      }

      if (json.available) {
        setWearableStatus("available");
        toast.success("Device ID is available and can be linked.");
      } else {
        setWearableStatus("unavailable");
        setWearableReason("reason" in json ? json.reason ?? "unavailable" : "unavailable");
        toast.error("Device ID is not available to link.");
      }
    } catch {
      setWearableStatus("unavailable");
      setWearableReason("network_error");
      toast.error("Network error verifying device ID.");
    }
  }

  function addContact() {
    const name = contactDraft.name.trim();
    const phone = contactDraft.phone.trim();
    const relationship = contactDraft.relationship.trim();

    if (!name) return toast.error("Contact name is required.");
    if (!phone) return toast.error("Contact phone number is required.");
    if (!relationship) return toast.error("Relationship is required.");
    if (contacts.length >= 3) return toast.error("You can only add up to 3 contacts.");

    setContacts((prev) => [...prev, { name, phone, relationship }]);
    setContactDraft({ name: "", phone: "", relationship: "" });
    setIsContactDialogOpen(false);
    toast.success("Emergency contact added.");
  }

  function removeContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (!fullName.trim()) return toast.error("Full name is required.");
    if (fullName.trim().length < 2) return toast.error("Full name must be at least 2 characters.");
    if (!phoneNumber.trim()) return toast.error("Phone number is required.");
    if (phoneNumber.trim().length < 10) return toast.error("Please enter a valid phone number.");
    if (!idType) return toast.error("ID type is required.");
    if (!idNumber.trim()) return toast.error("ID number is required.");
    if (idNumber.trim().length < 4) return toast.error("Please enter a valid ID number.");
    if (!destination.trim()) return toast.error("Destination is required.");
    if (destination.trim().length < 2) return toast.error("Please enter a valid destination.");
    if (!tripStartDate) return toast.error("Trip start date is required.");
    if (!tripEndDate) return toast.error("Trip end date is required.");
    if (new Date(tripEndDate) < new Date(tripStartDate)) {
      return toast.error("Trip end date must be after start date.");
    }
    if (new Date(tripStartDate).getTime() < new Date().setHours(0,0,0,0)) {
      return toast.error("Trip start date cannot be in the past.");
    }
    if (!preferredLanguage) return toast.error("Preferred language is required.");
    if (contacts.length < 1) return toast.error("Add at least 1 emergency contact.");

    if (deviceId.trim() && wearableStatus === "unavailable") {
      return toast.error("Device ID failed verification. Clear it or enter a different ID.");
    }

    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("phoneNumber", phoneNumber);
    fd.set("idType", idType);
    fd.set("idNumber", idNumber);
    fd.set("destination", destination);
    fd.set("tripStartDate", tripStartDate);
    fd.set("tripEndDate", tripEndDate);
    fd.set("preferredLanguage", preferredLanguage);
    fd.set("emergencyContacts", JSON.stringify(contacts));

    if (deviceId.trim()) fd.set("deviceId", deviceId.trim());

    startSubmit(async () => {
      try {
        const result = await submitOnboarding(fd);
        if (result && !result.success) {
          toast.error(result.error || "Failed to submit onboarding.");
          return;
        }
        router.push("/dashboard");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to submit onboarding.";
        toast.error(message);
      }
    });
  }

  return (
    <div className="flex-1 w-full bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tourist onboarding</h1>
            <p className="text-sm text-muted-foreground">
              Complete these steps once to access your dashboard.
            </p>
          </div>
          <Badge variant="secondary">Step {step} of 4</Badge>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>Your information is used for safety and emergency response.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={step} onValueChange={(v) => setStep(v as typeof step)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="1">Personal</TabsTrigger>
                <TabsTrigger value="2">Trip</TabsTrigger>
                <TabsTrigger value="3">Contacts</TabsTrigger>
                <TabsTrigger value="4">Wearable</TabsTrigger>
              </TabsList>

              <TabsContent value="1" className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={photoPreviewUrl ?? undefined} alt="Tourist photo preview" />
                    <AvatarFallback>
                      {(fullName.trim()[0] ?? "T").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Label htmlFor="photo">Photo (optional)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Racha Sharma"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone number</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(onlyDigitsPhone(e.target.value))}
                      placeholder="+91..."
                      inputMode="tel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ID type</Label>
                    <Select value={idType} onValueChange={(v) => setIdType(v as string)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Driving Licence">Driving Licence</SelectItem>
                        <SelectItem value="Voter ID">Voter ID</SelectItem>
                        <SelectItem value="Student ID">Student ID</SelectItem>
                        <SelectItem value="Foreign National ID">Foreign National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID number</Label>
                    <Input
                      id="idNumber"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="Enter your ID number"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="2" className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Goa"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tripStart">Trip start date</Label>
                    <Input
                      id="tripStart"
                      type="date"
                      value={tripStartDate}
                      onChange={(e) => setTripStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tripEnd">Trip end date</Label>
                    <Input
                      id="tripEnd"
                      type="date"
                      value={tripEndDate}
                      onChange={(e) => setTripEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred language</Label>
                  <Select
                    value={preferredLanguage}
                    onValueChange={(v) => setPreferredLanguage(v as (typeof LANGUAGES)[number])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Sheet>
                  <SheetTrigger>
                    <Button type="button" variant="outline">
                      Preview trip summary
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Trip summary</SheetTitle>
                      <SheetDescription>Review before proceeding.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Destination</span>
                        <span className="font-medium">{destination || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Start</span>
                        <span className="font-medium">{tripStartDate || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">End</span>
                        <span className="font-medium">{tripEndDate || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Language</span>
                        <span className="font-medium">{preferredLanguage || "—"}</span>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </TabsContent>

              <TabsContent value="3" className="mt-6 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Emergency contacts</div>
                    <div className="text-sm text-muted-foreground">
                      Add up to 3 contacts. You must add at least 1.
                    </div>
                  </div>
                  <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                    <DialogTrigger>
                      <Button type="button" variant="outline">
                        Add contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add emergency contact</DialogTitle>
                        <DialogDescription>These people may be contacted during an emergency.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cName">Name</Label>
                          <Input
                            id="cName"
                            value={contactDraft.name}
                            onChange={(e) => setContactDraft((p) => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cPhone">Phone number</Label>
                          <Input
                            id="cPhone"
                            value={contactDraft.phone}
                            onChange={(e) =>
                              setContactDraft((p) => ({ ...p, phone: onlyDigitsPhone(e.target.value) }))
                            }
                            inputMode="tel"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cRel">Relationship</Label>
                          <Input
                            id="cRel"
                            value={contactDraft.relationship}
                            onChange={(e) => setContactDraft((p) => ({ ...p, relationship: e.target.value }))}
                            placeholder="e.g. Parent / Spouse / Friend"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={addContact}>
                          Save contact
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {contacts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    No emergency contacts yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {contacts.map((c, idx) => (
                      <Card key={`${c.phone}-${idx}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{c.name}</div>
                                <Badge variant="secondary">{c.relationship}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">{c.phone}</div>
                            </div>
                            <Button type="button" variant="ghost" onClick={() => removeContact(idx)}>
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="4" className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID (optional)</Label>
                  <Input
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) => {
                      setDeviceId(e.target.value);
                      setWearableStatus("idle");
                      setWearableReason(null);
                    }}
                    placeholder="e.g. WB-12345"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={verifyWearable}
                      disabled={!deviceId.trim() || wearableStatus === "checking"}
                    >
                      {wearableStatus === "checking" ? "Verifying..." : "Verify device"}
                    </Button>
                    {wearableStatus === "available" && <Badge>Verified</Badge>}
                    {wearableStatus === "unavailable" && (
                      <Badge variant="destructive">
                        Not available{wearableReason ? ` (${wearableReason})` : ""}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If you don’t have a wearable, you can skip this step.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={goBack} disabled={step === "1" || isSubmitting}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                {step !== "4" ? (
                  <Button type="button" onClick={goNext} disabled={isSubmitting}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={submit} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Complete onboarding"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          Already onboarded?{" "}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

