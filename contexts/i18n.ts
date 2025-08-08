import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

const LANGUAGE_KEY = 'appLanguage';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

export const setI18nLanguage = async (lng: string) => {
  i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
};

export const getSavedLanguage = async (): Promise<string | null> => {
  try {
    const lng = await AsyncStorage.getItem(LANGUAGE_KEY);
    return lng;
  } catch {
    return null;
  }
};

export default i18n;
