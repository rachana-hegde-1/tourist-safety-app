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

  await i18n.use(initReactI18next).init({
    lng: savedLanguage,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { common: require('../../public/locales/en/common.json') },
      hi: { common: require('../../public/locales/hi/common.json') },
      bn: { common: require('../../public/locales/bn/common.json') },
      ta: { common: require('../../public/locales/ta/common.json') },
      te: { common: require('../../public/locales/te/common.json') },
      kn: { common: require('../../public/locales/kn/common.json') },
      ml: { common: require('../../public/locales/ml/common.json') },
      mr: { common: require('../../public/locales/mr/common.json') },
      gu: { common: require('../../public/locales/gu/common.json') },
      or: { common: require('../../public/locales/or/common.json') },
      as: { common: require('../../public/locales/as/common.json') }
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
