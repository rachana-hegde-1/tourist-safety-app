"use client";

import { useSOSPolling } from "@/hooks/useSOSPolling";

export function SOSAlertOverlay() {
  const { activeAlert, dismissAlert } = useSOSPolling(true, 4000);

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-600 animate-pulse-fast">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 bg-red-700 animate-ping opacity-20" />
      
      <div className="relative z-10 text-center text-white px-8 max-w-lg">
        {/* Large SOS icon */}
        <div className="mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-white/20 flex items-center justify-center border-4 border-white animate-bounce">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Alert text */}
        <h1 className="text-5xl font-black mb-4 tracking-wider drop-shadow-lg">
          🚨 SOS ALERT 🚨
        </h1>
        <p className="text-2xl font-bold mb-2">
          Emergency Triggered from Wearable
        </p>
        <p className="text-lg opacity-90 mb-2">
          {activeAlert.message || "SOS button activated on wearable device"}
        </p>
        {activeAlert.latitude !== 0 && (
          <p className="text-sm opacity-75 mb-8 font-mono">
            📍 {activeAlert.latitude.toFixed(6)}, {activeAlert.longitude.toFixed(6)}
          </p>
        )}

        {/* Cancel button */}
        <button
          onClick={dismissAlert}
          className="bg-white text-red-600 font-bold text-xl px-12 py-4 rounded-full shadow-2xl hover:bg-gray-100 transition-all active:scale-95"
        >
          ✕ Cancel Alert
        </button>

        <p className="text-xs opacity-60 mt-6">
          Emergency services have been notified. Tap cancel if this was a false alarm.
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-fast {
          0%, 100% { background-color: #dc2626; }
          50% { background-color: #991b1b; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
