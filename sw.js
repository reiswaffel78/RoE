
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const SW_VERSION = 'roe-sw-v20250217';
self.__SW_VERSION__ = SW_VERSION;

workbox.core.setCacheNameDetails({
  prefix: 'roe',
  suffix: SW_VERSION,
});


workbox.core.skipWaiting();
workbox.core.clientsClaim();

// Precache placeholder entries - Vite will inject real assets during build.
workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: null },

]);

// Caching strategy for audio files
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'audio',
  new workbox.strategies.CacheFirst({
    cacheName: 'audio-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20, // Cache up to 20 audio files
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// This message listener allows the new service worker to take control immediately.
self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: SW_VERSION });
    } else if (event.source && event.source.postMessage) {
      event.source.postMessage({ version: SW_VERSION });
    }
  }
});
