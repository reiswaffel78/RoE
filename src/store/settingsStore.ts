import { create } from 'zustand';
import type { BuyAmount } from '../core';

export type Quality = 'low' | 'medium' | 'high';
export type NumberFormat = 'short' | 'scientific';
export type Language = 'de' | 'en';

export interface Settings {
    language: Language;
    quality: Quality;
    reducedMotion: boolean;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    numberFormat: NumberFormat;
    buyAmount: BuyAmount;
    geminiKey: string;
}

const KEY = 'roe-settings';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const detectLanguage = (): Language => {
    const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
    return nav?.toLowerCase().startsWith('de') ? 'de' : 'en';
};

const detectQuality = (): Quality => {
    if (typeof navigator === 'undefined') return 'medium';
    const cores = navigator.hardwareConcurrency ?? 4;
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    if (mobile || cores <= 2) return 'low';
    return cores >= 8 ? 'high' : 'medium';
};

const defaults = (): Settings => ({
    language: detectLanguage(),
    quality: detectQuality(),
    reducedMotion: prefersReducedMotion(),
    musicVolume: 0.5,
    sfxVolume: 0.7,
    muted: false,
    numberFormat: 'short',
    buyAmount: 1,
    geminiKey: '',
});

const load = (): Settings => {
    const base = defaults();
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return base;
        const parsed = JSON.parse(raw) as Partial<Settings>;
        return { ...base, ...parsed };
    } catch {
        return base;
    }
};

interface SettingsStore extends Settings {
    set: (patch: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>()((set, get) => ({
    ...load(),
    set: (patch) => {
        set(patch);
        try {
            const { set: _omit, ...data } = { ...get(), ...patch };
            void _omit;
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch {
            /* storage unavailable */
        }
    },
}));
