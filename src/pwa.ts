/** Registers the Workbox service worker (production only) and auto-updates. */
export const registerServiceWorker = () => {
    if (import.meta.env.DEV || import.meta.env.MODE === 'artifact' || !('serviceWorker' in navigator)) return;
    if (new URLSearchParams(location.search).has('noSW')) return;
    // Loaded lazily so builds without the PWA plugin never import it.
    import('virtual:pwa-register')
        .then(({ registerSW }) => registerSW({ immediate: true }))
        .catch(() => undefined);
};
