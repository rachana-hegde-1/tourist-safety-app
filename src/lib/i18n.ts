import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

interface Language {
  name: string;
  nativeName: string;
  code: string;
}

interface Languages {
  [key: string]: Language;
}

const languages: Languages = {
  en: { name: 'English', nativeName: 'English', code: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिंदी', code: 'hi' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', code: 'bn' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', code: 'te' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn' },
  ml: { name: 'Malayalam', nativeName: 'മലയളം', code: 'ml' },
  mr: { name: 'Marathi', nativeName: 'मराठी', code: 'mr' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', code: 'or' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', code: 'as' }
};

export const initI18n = async () => {
  const savedLanguage = typeof window !== 'undefined' 
    ? localStorage.getItem('tourist-safety-language') || 'en'
    : 'en';

  await initReactI18next({
    lng: savedLanguage,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    formatSeparator: ',',
      format: (value: string, format: string | undefined, lng: string | undefined) => {
        if (format === 'uppercase') {
          return value.toUpperCase();
        }
        return value;
      },
    },
    
    resources: {
      en: {
        common: (await import('../public/locales/en/common.json')).default
      },
      hi: {
        common: (await import('../public/locales/hi/common.json')).default
      },
      bn: {
        common: (await import('../public/locales/bn/common.json')).default
      },
      ta: {
        common: (await import('../public/locales/ta/common.json')).default
      },
      te: {
        common: (await import('../public/locales/te/common.json')).default
      },
      kn: {
        common: (await import('../public/locales/kn/common.json')).default
      },
      ml: {
        common: (await import('../public/locales/ml/common.json')).default
      },
      mr: {
        common: (await import('../public/locales/mr/common.json')).default
      },
      gu: {
        common: (await import('../public/locales/gu/common.json')).default
      },
      or: {
        common: (await import('../public/locales/or/common.json')).default
      },
      as: {
        common: (await import('../public/locales/as/common.json')).default
      }
    },
    
    detection: {
      order: ['en', 'hi', 'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'or', 'as'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });
};

export const changeLanguage = async (languageCode: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tourist-safety-language', languageCode);
  }
  
  await i18n.changeLanguage(languageCode);
};

export const getCurrentLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tourist-safety-language') || 'en';
  }
  return 'en';
};

export const getLanguageInfo = (languageCode: string) => {
  return languages[languageCode as keyof typeof languages] || languages.en;
};

export const getAllLanguages = () => {
  return Object.values(languages);
};

export { languages };
