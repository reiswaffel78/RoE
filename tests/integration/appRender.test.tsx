import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../i18n/locales/en.json';
import de from '../../i18n/locales/de.json';

// Render the full app tree (server-side) to catch runtime crashes in
// selectors, hooks and i18n wiring without needing a browser.
describe('App render smoke test', () => {
    beforeAll(async () => {
        // Disable Pixi/audio/AI so the render does not touch browser-only APIs.
        const url = new URL(window.location.href);
        url.search = '?safe=1';
        window.history.replaceState({}, '', url.toString());
        const { refreshFlagsCache } = await import('../../utils/flags');
        refreshFlagsCache();

        await i18n.use(initReactI18next).init({
            resources: { en: { translation: en }, de: { translation: de } },
            lng: 'en',
            fallbackLng: 'en',
            react: { useSuspense: false },
            interpolation: { escapeValue: false },
        });
    });

    it('renders core panels without throwing (English)', async () => {
        const { default: App } = await import('../../App');
        const html = renderToString(React.createElement(App));

        expect(html).toContain('Roots of the Earth');
        expect(html).toContain('Plants');
        expect(html).toContain('Upgrades');
        expect(html).toContain('Garden Log');
    });

    it('renders localized content in German', async () => {
        await i18n.changeLanguage('de');
        const { default: App } = await import('../../App');
        const html = renderToString(React.createElement(App));

        expect(html).toContain('Pflanzen');
        expect(html).toContain('Verbesserungen');
        expect(html).toContain('Garten-Protokoll');
    });
});
