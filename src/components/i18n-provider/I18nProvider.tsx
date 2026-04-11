"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/lib/i18n";
import type { i18n as I18nType } from "i18next";

interface I18nProviderProps {
  children: React.ReactNode;
  i18n: I18nType;
}

export function I18nProvider({ children, i18n }: I18nProviderProps) {
  useEffect(() => {
    initI18n();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
