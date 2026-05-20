import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const LANGUAGE_KEY = '@language';

export async function getStoredLanguage(): Promise<string> {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (lang) {
      console.log('[i18n] Using stored language preference:', lang);
      return lang;
    }
    const systemLocale = Localization.getLocales()[0]?.languageCode;
    console.log('[i18n] No stored preference — detected system locale:', systemLocale);
    const detectedLang = systemLocale === 'es' ? 'es' : 'en';
    console.log('[i18n] Defaulting to language:', detectedLang);
    return detectedLang;
  } catch {
    return 'en';
  }
}

export async function setStoredLanguage(lang: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function initI18n(): Promise<void> {
  const lang = await getStoredLanguage();
  await i18n
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, es: { translation: es } },
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
}

export default i18n;
