import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { markBootStepError, markBootStepSuccess, recordBootWarning } from '../utils/bootDiagnostics';

const DEFAULT_TRANSLATIONS = {
    en: {
        translation: {
            loading: 'Loading…',
            retry: 'Retry',
        },
    },
    de: {
        translation: {
            loading: 'Lädt…',
            retry: 'Erneut versuchen',
        },
    },
};

const localeUrls: Record<string, string> = {
    en: new URL('./locales/en.json', import.meta.url).href,
    de: new URL('./locales/de.json', import.meta.url).href,
};

type LocaleResource = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const fetchLocale = async (locale: string): Promise<LocaleResource | null> => {
    const url = localeUrls[locale];
    if (!url) {
        return null;
    }

    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            recordBootWarning(`i18n: Failed to load ${locale} (${response.status})`);
            return null;
        }
        const data = await response.json();
        if (!isPlainObject(data)) {
            recordBootWarning(`i18n: ${locale} payload was not an object`);
            return null;
        }
        return data;
    } catch (error) {
        recordBootWarning(`i18n: ${locale} fetch failed`);
        console.error(`Failed to load ${locale} locale`, error);
        return null;
    }
};

const buildResources = async (): Promise<Record<string, { translation: LocaleResource }>> => {
    const entries = await Promise.all(
        Object.keys(localeUrls).map(async (locale) => {
            const loaded = await fetchLocale(locale);
            const fallback = DEFAULT_TRANSLATIONS[locale as keyof typeof DEFAULT_TRANSLATIONS] ?? DEFAULT_TRANSLATIONS.en;
            return [locale, { translation: loaded ?? fallback.translation }] as const;
        }),
    );

    return Object.fromEntries(entries);
};

let initialised = false;

export const initializeI18n = async () => {
    if (initialised) {
        return;
    }

    try {
        const resources = await buildResources();
        await i18n
            .use(LanguageDetector)
            .use(initReactI18next)
            .init({
                resources,
                debug: import.meta.env.DEV,
                fallbackLng: 'en',
                interpolation: {
                    escapeValue: false,
                },
            });
        markBootStepSuccess('D', `i18n ready (${i18n.language})`);
        initialised = true;
    } catch (error) {
        markBootStepError('D', 'i18n failed to initialise');
        recordBootWarning('i18n fell back to defaults');
        console.error('i18n initialisation failed', error);
        try {
            await i18n.use(initReactI18next).init({
                resources: DEFAULT_TRANSLATIONS,
                fallbackLng: 'en',
                interpolation: { escapeValue: false },
            });
            markBootStepSuccess('D', 'i18n fallback active');
        } catch (nestedError) {
            console.error('i18n fallback initialisation failed', nestedError);
        }
    }
};

export default i18n;