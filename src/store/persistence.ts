import { normalizeState, type GameState } from '../core';

export const SAVE_KEY = 'roe-save-v2';
export const LEGACY_SAVE_KEY = 'zen-garden-save';

const storage = (): Storage | null => {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
        return null;
    }
};

export interface LoadResult {
    state: GameState | null;
    source: 'v2' | 'legacy' | 'none' | 'corrupt';
}

export const loadGame = (now = Date.now()): LoadResult => {
    const store = storage();
    if (!store) return { state: null, source: 'none' };
    let raw: string | null = null;
    let legacy: string | null = null;
    try {
        raw = store.getItem(SAVE_KEY);
        legacy = raw ? null : store.getItem(LEGACY_SAVE_KEY);
    } catch {
        return { state: null, source: 'none' };
    }
    if (raw) {
        try {
            return { state: normalizeState(JSON.parse(raw), now), source: 'v2' };
        } catch {
            return { state: null, source: 'corrupt' };
        }
    }
    if (legacy) {
        try {
            return { state: normalizeState(JSON.parse(legacy), now), source: 'legacy' };
        } catch {
            return { state: null, source: 'corrupt' };
        }
    }
    return { state: null, source: 'none' };
};

export const saveGame = (state: GameState): boolean => {
    const store = storage();
    if (!store) return false;
    try {
        store.setItem(SAVE_KEY, JSON.stringify(state));
        return true;
    } catch {
        return false;
    }
};

export const clearSave = () => {
    try {
        const store = storage();
        store?.removeItem(SAVE_KEY);
        store?.removeItem(LEGACY_SAVE_KEY);
    } catch {
        /* storage unavailable */
    }
};

// Export format: "ROE2:" + base64(JSON). Base64 keeps copy/paste safe.
const PREFIX = 'ROE2:';

export const encodeSave = (state: GameState): string => {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return PREFIX + btoa(binary);
};

export const decodeSave = (text: string, now = Date.now()): GameState => {
    const trimmed = text.trim();
    let json: string;
    if (trimmed.startsWith(PREFIX)) {
        const binary = atob(trimmed.slice(PREFIX.length));
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        json = new TextDecoder().decode(bytes);
    } else {
        json = trimmed; // plain JSON (also legacy exports)
    }
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('invalid');
    const obj = parsed as Record<string, unknown>;
    if (!('schema' in obj) && !('state' in obj) && !('chi' in obj)) throw new Error('invalid');
    return normalizeState(parsed, now);
};
