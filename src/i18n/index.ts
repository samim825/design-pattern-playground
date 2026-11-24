import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import bn from '@/locales/bn.json'
import en from '@/locales/en.json'
import type { Lang } from '@/types/pattern'

export const LANG_STORAGE_KEY = 'dpp-lang'

function readSavedLang(): Lang {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) === 'bn' ? 'bn' : 'en'
  } catch {
    return 'en'
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: readSavedLang(),
  fallbackLng: 'en', // missing Bangla strings fall back to English
  supportedLngs: ['en', 'bn'],
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false,
})

function syncDocument(lng: string) {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng)
  } catch {
    // storage unavailable (private mode) — language still works for this session
  }
}
syncDocument(i18n.language)
i18n.on('languageChanged', syncDocument)

/** Current UI language as our narrow Lang type. */
export function useLang(): Lang {
  const { i18n: instance } = useTranslation()
  return instance.resolvedLanguage === 'bn' ? 'bn' : 'en'
}

export default i18n
