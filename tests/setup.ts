// tests/setup.ts
import { vi } from 'vitest';

const createStorage = () => {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
            store.set(key, String(value));
        },
        removeItem: (key: string) => {
            store.delete(key);
        },
        clear: () => store.clear(),
    };
};

if (typeof globalThis.window === 'undefined') {
    const locationState = {
        href: 'http://localhost/',
        _search: '',
        get search() {
            return this._search;
        },
        set search(value: string) {
            this._search = value.startsWith('?') || value === '' ? value : `?${value}`;
            this.href = `http://localhost/${this._search}`;
        },
    };

    const history = {
        replaceState: (_state: unknown, _title: string | null, url?: string | URL | null) => {
            if (!url) {
                return;
            }
            const next = typeof url === 'string' ? url : url.toString();
            try {
                const parsed = new URL(next, 'http://localhost/');
                locationState.href = parsed.toString();
                locationState._search = parsed.search;
            } catch {
                locationState.href = next;
            }
        },
    };

    const fakeWindow = {
        location: locationState,
        history,
        localStorage: createStorage(),
        sessionStorage: createStorage(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
        cancelAnimationFrame: (id: number) => clearTimeout(id),
        setInterval,
        clearInterval,
        navigator: { serviceWorker: undefined },
    } as unknown as Window & typeof globalThis;

    const fakeDocument = {
        createElement: (tag: string) => ({
            tagName: tag.toUpperCase(),
            style: {},
            appendChild: vi.fn(),
            removeChild: vi.fn(),
        }),
        body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
        },
        getElementById: vi.fn(),
    } as unknown as Document;

    (globalThis as unknown as Record<string, unknown>).window = fakeWindow;
    (globalThis as unknown as Record<string, unknown>).document = fakeDocument;
    (globalThis as unknown as Record<string, unknown>).HTMLElement = class {};
}

if (typeof globalThis.fetch === 'undefined') {
    globalThis.fetch = vi.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch;
}