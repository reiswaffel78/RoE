import { registerSW } from 'virtual:pwa-register';

/** Registers the Workbox service worker (production only) and auto-updates. */
export const registerServiceWorker = () => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    if (new URLSearchParams(location.search).has('noSW')) return;
    registerSW({ immediate: true });
};
