import { useTranslation } from "react-i18next";

export function useT() {
  const { t } = useTranslation();
  return t;
}

export function useTranslationKey(key: string, options?: any) {
  const { t } = useTranslation();
  return t(key, options);
}
