"use client";

import { InstallPrompt } from "@/components/install-prompt/InstallPrompt";
import { LanguageSelector } from "@/components/language-selector/SimpleLanguageSelector";

export function PWALayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">TS</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Tourist Safety</span>
          </div>
          
          <LanguageSelector />
        </div>
      </div>
      
      <InstallPrompt />
      
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
