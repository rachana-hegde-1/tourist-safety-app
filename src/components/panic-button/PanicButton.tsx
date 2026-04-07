"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslationKey } from "@/hooks/useTranslation";

export function PanicButton() {
  const { t } = useTranslationKey();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const handlePanicClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setIsActivating(true);
    setShowConfirm(false);
    
    // Here you would trigger the emergency alert
    setTimeout(() => {
      setIsActivating(false);
    }, 3000);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (isActivating) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-red-600 text-white p-6 rounded-lg shadow-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">
              {t("panic_button.emergency_activated")}
            </h3>
            <p className="text-sm">
              {t("panic_button.emergency_services_notified")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Button
        onClick={handlePanicClick}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full shadow-lg animate-pulse"
      >
        {t("buttons.panic")}
      </Button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <Alert>
              <AlertTitle className="text-red-600">
                {t("panic_button.confirm_emergency")}
              </AlertTitle>
              <AlertDescription className="text-gray-700">
                {t("panic_button.emergency_confirmation_message")}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {t("panic_button.yes_activate_emergency")}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                {t("panic_button.no_cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
