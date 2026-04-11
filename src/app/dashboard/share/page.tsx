"use client";

import { useState } from "react";
import { Share2, Link, Copy, MessageSquare, QrCode, Shield } from "lucide-react";
import { useTouristData } from "@/hooks/useTouristData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function DashboardSharePage() {
  const { touristData, isLoading, error } = useTouristData();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await fetch("/api/tracking-links/create", { method: "POST" });
      const json = await response.json();

      if (!response.ok || !json.ok || !json.full_url) {
        throw new Error(json.reason || "Failed to create tracking link");
      }

      setTrackingUrl(json.full_url);
      setExpiresAt(json.expires_at ?? null);
      toast.success("Tracking link generated successfully!");
    } catch {
      toast.error("Failed to generate tracking link.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const shareOnWhatsApp = () => {
    if (!trackingUrl) return;
    const message = `Live tourist tracking link: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-10 w-3/5 rounded-lg bg-slate-200 animate-pulse" />
            <div className="grid gap-6">
              {[...Array(3)].map((item, index) => (
                <div key={index} className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !touristData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <Share2 className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-semibold text-red-900">Unable to load share settings</h2>
            <p className="mt-2 text-sm text-red-700">{error || "Please try again later."}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Live Tracking Share</h1>
          <p className="text-sm text-slate-600">
            Generate a secure link that lets trusted contacts track your current location for the next 24 hours.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Create a live tracking link
            </CardTitle>
            <CardDescription>
              This link is active for 24 hours and can be shared over WhatsApp or copied directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm text-slate-700">
                  {touristData.full_name
                    ? `Generate a tracking link for ${touristData.full_name}.`
                    : "Generate a tracking link to share your live location."}
                </p>
              </div>
              <Button onClick={handleGenerateLink} disabled={isGeneratingLink}>
                <QrCode className="mr-2 h-4 w-4" />
                {isGeneratingLink ? "Generating..." : "Generate Link"}
              </Button>
            </div>

            {trackingUrl && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 break-all text-sm text-slate-700">
                  {trackingUrl}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={copyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy link
                  </Button>
                  <Button onClick={shareOnWhatsApp}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Share on WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => window.open(trackingUrl, "_blank") }>
                    <Link className="mr-2 h-4 w-4" />
                    Open link
                  </Button>
                </div>
                {expiresAt && (
                  <p className="text-sm text-slate-500">
                    Expires at {new Date(expiresAt).toLocaleString()}.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety & privacy
            </CardTitle>
            <CardDescription>Only share your tracking link with people you trust.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Links automatically expire after 24 hours.</p>
            <p>Anyone with the link can view your live location until it expires.</p>
            <p>If you want to stop sharing sooner, generate a new link and stop using the old one.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
