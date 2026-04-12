"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Home } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className = "" }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Check if app is already installed
    const isInstalled = localStorage.getItem("pwa-installed");
    let timer: NodeJS.Timeout | undefined;
    
    if (!isInstalled) {
      timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          localStorage.setItem("pwa-installed", "true");
          localStorage.setItem("pwa-installed-date", new Date().toISOString());
          setShowPrompt(false);
        }
      } catch (error) {
        console.error("Error installing PWA:", error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-dismissed", "true");
    localStorage.setItem("pwa-dismissed-date", new Date().toISOString());
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 relative">
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-lg flex items-center justify-center">
            <Download className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Install Aegistrack
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Get instant access to emergency alerts and safety features
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home className="h-4 w-4 mr-2" />
            Add to Home Screen
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            Not Now
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Install for offline access and quick emergency alerts
        </p>
      </div>
    </div>
  );
}
