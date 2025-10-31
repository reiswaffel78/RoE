export type FlagName = 'safe' | 'noSW' | 'noPixi' | 'noAudio' | 'noAI';

export type FlagSnapshot = Record<FlagName, boolean>;

const STORAGE_KEYS: Partial<Record<FlagName, string>> = {
    safe: 'SAFE_MODE',
    noSW: 'NO_SW',
    noPixi: 'NO_PIXI',
    noAudio: 'NO_AUDIO',
    noAI: 'NO_AI',
};

let cachedFlags: FlagSnapshot | null = null;

const parseBoolean = (value: string | null | undefined): boolean | null => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized)) {
        return true;
    }
    if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) {
        return false;
    }
    return null;
};

const readFromStorage = (key: string | undefined): boolean | null => {
    if (!key || typeof window === 'undefined' || !window.localStorage) {
        return null;
    }
    try {
        const value = window.localStorage.getItem(key);
        return parseBoolean(value ?? undefined);
    } catch {
        return null;
    }
};

const computeFlags = (): FlagSnapshot => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const safeParam = parseBoolean(params.get('safe')) ?? readFromStorage(STORAGE_KEYS.safe);
    const safe = safeParam ?? false;

    const noSWExplicit = (() => {
        const swParam = params.get('sw');
        const explicit = parseBoolean(params.get('noSW'));
        if (swParam !== null) {
            const parsed = parseBoolean(swParam);
            if (parsed !== null) {
                return !parsed;
            }
            if (swParam.trim() === '0') {
                return true;
            }
        }
        if (explicit !== null) {
            return explicit;
        }
        return readFromStorage(STORAGE_KEYS.noSW);
    })();

    const noPixiExplicit = parseBoolean(params.get('noPixi')) ?? readFromStorage(STORAGE_KEYS.noPixi);
    const noAudioExplicit = parseBoolean(params.get('noAudio')) ?? readFromStorage(STORAGE_KEYS.noAudio);
    const noAIExplicit = parseBoolean(params.get('noAI')) ?? readFromStorage(STORAGE_KEYS.noAI);

    const snapshot: FlagSnapshot = {
        safe,
        noSW: Boolean(safe || noSWExplicit),
        noPixi: Boolean(safe || noPixiExplicit),
        noAudio: Boolean(safe || noAudioExplicit),
        noAI: Boolean(safe || noAIExplicit),
    };

    return snapshot;
};

export const getFlags = (): FlagSnapshot => {
    if (!cachedFlags) {
        cachedFlags = computeFlags();
    }
    return cachedFlags;
};

export const getFlag = (flag: FlagName): boolean => getFlags()[flag];

export const refreshFlagsCache = () => {
    cachedFlags = computeFlags();
    return cachedFlags;
};