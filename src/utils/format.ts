import type { NumberFormat } from '../store/settingsStore';

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

let currentFormat: NumberFormat = 'short';
let currentLocale = 'en';

export const setNumberFormat = (format: NumberFormat, locale: string) => {
    currentFormat = format;
    currentLocale = locale;
};

const fixed = (value: number, digits: number) =>
    value.toLocaleString(currentLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Compact number: 1.23K, 45.6M … or scientific 1.23e9. */
export const formatNumber = (value: number, precise = false): string => {
    if (!Number.isFinite(value)) return '∞';
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    if (abs < 1000) {
        if (abs < 10 && (precise || !Number.isInteger(abs))) return sign + fixed(abs, abs < 1 && abs > 0 ? 2 : 1);
        return sign + fixed(Math.floor(abs), 0);
    }
    const tier = Math.floor(Math.log10(abs) / 3);
    if (currentFormat === 'scientific' || tier >= SUFFIXES.length) {
        const exp = Math.floor(Math.log10(abs));
        return `${sign}${fixed(abs / Math.pow(10, exp), 2)}e${exp}`;
    }
    const scaled = abs / Math.pow(1000, tier);
    const digits = scaled >= 100 ? 1 : 2;
    return `${sign}${fixed(scaled, digits)}${SUFFIXES[tier]}`;
};

export const formatPercent = (ratio: number, digits = 0): string => `${fixed(ratio * 100, digits)} %`;

export const formatMultiplier = (value: number): string => `×${fixed(value, value >= 10 ? 0 : 2)}`;

/** 3725 -> "1 h 2 min", 45 -> "45 s" */
export const formatDuration = (seconds: number): string => {
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
    if (m > 0) return sec > 0 && m < 10 ? `${m} min ${sec} s` : `${m} min`;
    return `${sec} s`;
};

/** Countdown style 1:05 */
export const formatClock = (seconds: number): string => {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
};
