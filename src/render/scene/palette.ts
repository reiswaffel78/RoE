// Art direction: flat, atmospheric illustration. Each zone owns one muted,
// near-monochrome mood (day + night). Landscape layers take their colour from
// atmospheric perspective: far layers dissolve into the haze, near layers sink
// into the zone's deepest tone.

import type { WeatherKind, ZoneId } from '../../core';
import { hex, mix, scale } from './color';

export interface Palette {
    skyTop: number;
    skyBottom: number;
    sun: number;
    /** atmosphere colour far layers fade into */
    haze: number;
    /** darkest silhouette tone (nearest layers) */
    deep: number;
    ground: number;
    water: number;
    /** zone accent (snow, rune glow, blossoms …) */
    accent: number;
    /** ambient light multiplied onto plants */
    light: number;
    /** colour of the heart tree's crown */
    foliage: number;
}

type PaletteHex = Record<keyof Palette, string>;

const P = (p: PaletteHex): Palette =>
    Object.fromEntries(Object.entries(p).map(([k, v]) => [k, hex(v)])) as unknown as Palette;

const DAY: Record<ZoneId, Palette> = {
    grove: P({
        skyTop: '#a3b38c', skyBottom: '#dcd8a8', sun: '#f3e8bb', haze: '#a2b189', deep: '#1c3123',
        ground: '#294430', water: '#c6cda3', accent: '#d9c27c', light: '#eef0dc', foliage: '#6f8f5c',
    }),
    desert: P({
        skyTop: '#c46a40', skyBottom: '#eaa465', sun: '#f7d79c', haze: '#d48853', deep: '#461e15',
        ground: '#7e3f24', water: '#efbd86', accent: '#3d5a3c', light: '#ffe6c8', foliage: '#8f7a45',
    }),
    rainforest: P({
        skyTop: '#244c52', skyBottom: '#6c9a92', sun: '#cfe3d6', haze: '#5c8a83', deep: '#0b2224',
        ground: '#153935', water: '#a4d2c9', accent: '#d6768c', light: '#d6ede5', foliage: '#3f7a64',
    }),
    mountains: P({
        skyTop: '#6b82a5', skyBottom: '#b8c6d6', sun: '#f3ecd4', haze: '#93a8c0', deep: '#152336',
        ground: '#26374e', water: '#c6d4e0', accent: '#e8edf2', light: '#eef2f7', foliage: '#4f6a70',
    }),
    aurora: P({
        skyTop: '#28305f', skyBottom: '#8f7cae', sun: '#efe7f2', haze: '#7475a8', deep: '#11152f',
        ground: '#1c2244', water: '#8a8dc2', accent: '#62f0b5', light: '#dcdcf2', foliage: '#4c5c8a',
    }),
    dreamworld: P({
        skyTop: '#48337a', skyBottom: '#cf93c6', sun: '#fbe4f1', haze: '#a37abb', deep: '#281644',
        ground: '#3b265d', water: '#e0b6de', accent: '#f4bcd9', light: '#fae8f6', foliage: '#e7b3d2',
    }),
};

const NIGHT_SKY = hex('#060a1d');
const NIGHT_HORIZON = hex('#1a2247');
const NIGHT_HAZE = hex('#1c2646');

/** Night: same mood, sunk into blue darkness; the sun becomes a pale moon. */
const nightOf = (p: Palette, zone: ZoneId): Palette => {
    const keep = zone === 'aurora' || zone === 'dreamworld' ? 0.35 : 0.2;
    return {
        skyTop: mix(NIGHT_SKY, p.skyTop, keep * 0.6),
        skyBottom: mix(NIGHT_HORIZON, p.skyBottom, keep),
        sun: hex('#e8ecfb'),
        haze: mix(NIGHT_HAZE, p.haze, keep),
        deep: mix(hex('#03050d'), p.deep, 0.45),
        ground: mix(hex('#070b18'), p.ground, 0.35),
        water: mix(hex('#243058'), p.water, keep),
        accent: zone === 'aurora' ? p.accent : scale(p.accent, 0.55),
        light: mix(hex('#7d8cbf'), p.light, 0.15),
        foliage: mix(hex('#1b2544'), p.foliage, 0.35),
    };
};

const NIGHT: Record<ZoneId, Palette> = Object.fromEntries(
    (Object.keys(DAY) as ZoneId[]).map((z) => [z, nightOf(DAY[z], z)]),
) as Record<ZoneId, Palette>;

const keys = Object.keys(DAY.grove) as (keyof Palette)[];

export const lerpPalette = (a: Palette, b: Palette, t: number): Palette => {
    const out = {} as Palette;
    for (const k of keys) out[k] = mix(a[k], b[k], t);
    return out;
};

const WARM_SKY = hex('#eb9a6c');
const WARM_LIGHT = hex('#ffcfae');
const RAIN = hex('#5d6a78');

export interface GradeInput {
    zone: ZoneId;
    /** 0 night … 1 full day */
    daylight: number;
    /** sun elevation −1 … 1 (dawn/dusk warmth peaks near 0) */
    elevation: number;
    weather: Record<WeatherKind, number>;
    /** −1 earth … 1 dream */
    balanceTilt: number;
}

export const scenePalette = ({ zone, daylight, elevation, weather, balanceTilt }: GradeInput): Palette => {
    const p = lerpPalette(NIGHT[zone], DAY[zone], daylight);

    // Golden hour: a warm veil when the sun crosses the horizon.
    const warmth = Math.exp(-Math.pow(elevation / 0.28, 2)) * 0.55;
    if (warmth > 0.01) {
        p.skyBottom = mix(p.skyBottom, WARM_SKY, warmth);
        p.skyTop = mix(p.skyTop, WARM_SKY, warmth * 0.25);
        p.haze = mix(p.haze, WARM_SKY, warmth * 0.35);
        p.sun = mix(p.sun, hex('#ffc78f'), warmth);
        p.light = mix(p.light, WARM_LIGHT, warmth * 0.7);
    }

    // Rain: grey and heavy; mist: everything recedes into the haze.
    if (weather.rain > 0.01) {
        const r = weather.rain;
        p.skyTop = mix(p.skyTop, scale(RAIN, 0.5 + 0.5 * daylight), r * 0.5);
        p.skyBottom = mix(p.skyBottom, scale(RAIN, 0.6 + 0.5 * daylight), r * 0.45);
        p.haze = mix(p.haze, scale(RAIN, 0.6 + 0.4 * daylight), r * 0.35);
        p.sun = mix(p.sun, p.skyBottom, r * 0.8);
        p.light = mix(p.light, hex('#b8c2cf'), r * 0.35);
    }
    if (weather.mist > 0.01) {
        p.haze = mix(p.haze, mix(p.skyBottom, 0xffffff, 0.15), weather.mist * 0.35);
    }
    if (weather.aurora > 0.01) {
        p.skyBottom = mix(p.skyBottom, hex('#2b3f6a'), weather.aurora * 0.35);
        p.water = mix(p.water, hex('#3f8f86'), weather.aurora * 0.35);
    }

    // Balance: the faintest golden or violet cast over the world.
    const cast = balanceTilt < 0 ? hex('#e8bf72') : hex('#a48bf0');
    const amount = Math.abs(balanceTilt) * 0.07;
    p.skyBottom = mix(p.skyBottom, cast, amount);
    p.haze = mix(p.haze, cast, amount);
    return p;
};

/**
 * Atmospheric perspective: depth 0 = on the horizon, 1 = right in front.
 * Mist pushes everything further back into the haze.
 */
export const layerColor = (p: Palette, depth: number, mist = 0): number => {
    const d = Math.max(0, Math.min(1, depth * (1 - mist * 0.35)));
    return mix(p.haze, p.deep, Math.pow(d, 1.15));
};

export const nightFactor = (daylight: number) => 1 - daylight;
