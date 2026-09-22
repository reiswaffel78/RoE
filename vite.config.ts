import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => ({
    base: './',
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
        react(),
        // The shareable web build (mode "artifact") runs where service workers are not allowed.
        mode !== 'artifact' &&
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
            manifest: {
                name: 'Roots of the Earth',
                short_name: 'Roots',
                description: 'A meditative idle game about balance between earth and dream.',
                lang: 'de',
                start_url: './',
                scope: './',
                display: 'standalone',
                orientation: 'any',
                background_color: '#05070f',
                theme_color: '#070b16',
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                // Only precache latin font subsets; others load on demand.
                globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
                navigateFallback: 'index.html',
            },
        }),
    ],
    build: {
        target: 'es2022',
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks: (id) => (id.includes('node_modules/pixi') ? 'pixi' : undefined),
            },
        },
    },
    test: {
        environment: 'node',
        testTimeout: 120_000,
    },
}));
