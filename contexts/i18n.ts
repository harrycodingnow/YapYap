// contexts/i18n.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

const LANGUAGE_KEY = 'appLanguage';
type AppLanguage = 'en' | 'zh';
const DEFAULT_LANG: AppLanguage = 'zh';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
} satisfies Resource;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en; // assumes en/zh share the same keys
    };
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANG,        // ✅ start in Chinese
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // compatibilityJSON: 'v4', // ✅ if you want it explicitly; otherwise omit
  // react: { useSuspense: false }, // add if you rely on no-suspense mode
});

export const setI18nLanguage = async (lng: AppLanguage) => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
};

export const getSavedLanguage = async (): Promise<AppLanguage | null> => {
  try {
    return (await AsyncStorage.getItem(LANGUAGE_KEY)) as AppLanguage | null;
  } catch {
    return null;
  }
};

export default i18n;
