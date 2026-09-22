// Art direction: hand-tuned palettes for four times of day, graded per zone,
// weather and garden balance. Everything the scene draws is tinted from here.

import type { WeatherKind, ZoneId } from '../../core';
import { hex, mix, scale } from './color';

export interface Palette {
    skyTop: number;
    skyMid: number;
    horizon: number;
    sun: number;
    cloud: number;
    far: number;
    mid: number;
    near: number;
    ground: number;
    fog: number;
    /** ambient light multiplied onto plants and props */
    light: number;
    /** rim/accent light for glows */
    accent: number;
}

const P = (p: Record<keyof Palette, string>): Palette =>
    Object.fromEntries(Object.entries(p).map(([k, v]) => [k, hex(v)])) as unknown as Palette;

const DAWN = P({
    skyTop: '#2c3566', skyMid: '#b46f86', horizon: '#f7bf8a', sun: '#ffcf96', cloud: '#f2a7a0',
    far: '#7a6c8e', mid: '#4a4a66', near: '#2d3148', ground: '#1b1f31', fog: '#e9a996', light: '#ffd8c4', accent: '#ffb38a',
});
const DAY = P({
    skyTop: '#2a6a9c', skyMid: '#79b3cf', horizon: '#e4efd6', sun: '#fff3d1', cloud: '#ffffff',
    far: '#7aa3b3', mid: '#467a70', near: '#2b5646', ground: '#1a372d', fog: '#cfe3dc', light: '#ffffff', accent: '#fff1c2',
});
const DUSK = P({
    skyTop: '#261f4d', skyMid: '#9a4a78', horizon: '#f79a66', sun: '#ffab6b', cloud: '#e98a86',
    far: '#5e4a74', mid: '#3a3152', near: '#241f38', ground: '#161427', fog: '#c9787f', light: '#ffc0a3', accent: '#ff9a6b',
});
const NIGHT = P({
    skyTop: '#03061a', skyMid: '#0c1636', horizon: '#1d3257', sun: '#cfe0ff', cloud: '#2b3b63',
    far: '#1b2946', mid: '#121d35', near: '#0b1326', ground: '#070c19', fog: '#243860', light: '#7e92cc', accent: '#9fc0ff',
});

/** Keyframes over the day phase (0 = sunrise, 0.25 noon, 0.5 sunset, 0.75 midnight). */
const KEYS: [number, Palette][] = [
    [0.0, DAWN],
    [0.1, DAY],
    [0.4, DAY],
    [0.5, DUSK],
    [0.58, NIGHT],
    [0.92, NIGHT],
    [1.0, DAWN],
];

const keys = Object.keys(DAY) as (keyof Palette)[];

export const lerpPalette = (a: Palette, b: Palette, t: number): Palette => {
    const out = {} as Palette;
    for (const k of keys) out[k] = mix(a[k], b[k], t);
    return out;
};

export const paletteAt = (phase: number): Palette => {
    for (let i = 0; i < KEYS.length - 1; i++) {
        const [p0, a] = KEYS[i];
        const [p1, b] = KEYS[i + 1];
        if (phase >= p0 && phase <= p1) {
            const t = p1 === p0 ? 0 : (phase - p0) / (p1 - p0);
            return lerpPalette(a, b, t * t * (3 - 2 * t));
        }
    }
    return DAWN;
};

/** Zone colour grading: how strongly sky and land are pulled towards a tint. */
export interface ZoneGrade {
    tint: number;
    sky: number;
    land: number;
    fog: number;
    /** additional aurora intensity at night */
    aurora: number;
    /** landscape silhouette style */
    terrain: 'rolling' | 'hills' | 'hollow' | 'peaks';
}

export const ZONE_GRADES: Record<ZoneId, ZoneGrade> = {
    grove: { tint: hex('#5fae8e'), sky: 0.0, land: 0.08, fog: 0.05, aurora: 0, terrain: 'rolling' },
    meadow: { tint: hex('#f3b45a'), sky: 0.14, land: 0.2, fog: 0.25, aurora: 0, terrain: 'hills' },
    hollow: { tint: hex('#8a6de0'), sky: 0.22, land: 0.3, fog: 0.35, aurora: 0.15, terrain: 'hollow' },
    peaks: { tint: hex('#7fd6ef'), sky: 0.12, land: 0.18, fog: 0.2, aurora: 0.45, terrain: 'peaks' },
};

const RAIN_TINT = hex('#56657a');
const MIST_TINT = hex('#b7a9d6');
const GOLD = hex('#f5c46b');
const VIOLET = hex('#9b7cf0');

export interface GradeInput {
    phase: number;
    zone: ZoneGrade;
    weather: Record<WeatherKind, number>;
    /** -1 (earth) .. 1 (dream) */
    balanceTilt: number;
}

export const gradePalette = ({ phase, zone, weather, balanceTilt }: GradeInput): Palette => {
    const base = paletteAt(phase);
    const out = { ...base };
    const skyKeys: (keyof Palette)[] = ['skyTop', 'skyMid', 'horizon', 'cloud'];
    const landKeys: (keyof Palette)[] = ['far', 'mid', 'near', 'ground'];
    for (const k of skyKeys) out[k] = mix(out[k], zone.tint, zone.sky);
    for (const k of landKeys) out[k] = mix(out[k], zone.tint, zone.land * (k === 'ground' ? 0.5 : 1));
    out.fog = mix(out.fog, zone.tint, zone.fog);

    // Balance gives the whole world a gentle golden or violet cast.
    const cast = balanceTilt < 0 ? GOLD : VIOLET;
    const castAmount = Math.abs(balanceTilt) * 0.1;
    for (const k of [...skyKeys, ...landKeys, 'fog' as const]) out[k] = mix(out[k], cast, castAmount);

    // Weather grading.
    const rain = weather.rain;
    if (rain > 0) {
        for (const k of skyKeys) out[k] = mix(out[k], scale(RAIN_TINT, 0.6 + 0.4 * lum(phase)), rain * 0.55);
        for (const k of landKeys) out[k] = mix(out[k], scale(out[k], 0.75), rain * 0.6);
        out.light = mix(out.light, hex('#b9c4d6'), rain * 0.4);
        out.sun = mix(out.sun, out.skyMid, rain * 0.7);
    }
    const mist = weather.mist;
    if (mist > 0) {
        out.fog = mix(out.fog, MIST_TINT, mist * 0.4);
        for (const k of ['far', 'mid'] as const) out[k] = mix(out[k], out.fog, mist * 0.45);
    }
    const aurora = weather.aurora;
    if (aurora > 0) {
        out.skyMid = mix(out.skyMid, hex('#0f3a4a'), aurora * 0.5);
        out.horizon = mix(out.horizon, hex('#1d5a5a'), aurora * 0.4);
        out.light = mix(out.light, hex('#9cf2d6'), aurora * 0.3);
        out.accent = mix(out.accent, hex('#7dffcf'), aurora * 0.6);
    }
    return out;
};

const lum = (phase: number) => {
    const e = Math.sin(phase * Math.PI * 2);
    return Math.max(0, Math.min(1, e + 0.2));
};
