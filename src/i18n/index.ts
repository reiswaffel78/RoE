import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de';
import en from './locales/en';
import type { Language } from '../store/settingsStore';

// Locales are bundled (no fetch) so the game works fully offline.
export const initI18n = (language: Language) => {
    if (i18n.isInitialized) return i18n;
    void i18n.use(initReactI18next).init({
        resources: { de: { translation: de }, en: { translation: en } },
        lng: language,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        returnNull: false,
    });
    document.documentElement.lang = language;
    return i18n;
};

export const setLanguage = (language: Language) => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
};

export default i18n;
