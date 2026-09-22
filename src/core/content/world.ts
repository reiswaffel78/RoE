import type { BuffId, WeatherKind, ZoneId } from '../types';

export interface ZoneDef {
    id: ZoneId;
    cost: number;
    physical: number;
    ethereal: number;
    harmony: number;
    weather: Record<WeatherKind, number>;
}

export const ZONES: ZoneDef[] = [
    { id: 'grove', cost: 0, physical: 1, ethereal: 1, harmony: 1, weather: { clear: 6, rain: 2, mist: 2, aurora: 0.6 } },
    { id: 'meadow', cost: 25_000, physical: 1.35, ethereal: 0.9, harmony: 1, weather: { clear: 7, rain: 3, mist: 0.6, aurora: 0.3 } },
    { id: 'hollow', cost: 2_000_000, physical: 0.9, ethereal: 1.35, harmony: 1, weather: { clear: 3, rain: 2, mist: 6, aurora: 0.6 } },
    { id: 'peaks', cost: 300_000_000, physical: 1.15, ethereal: 1.15, harmony: 1.6, weather: { clear: 4, rain: 1, mist: 2, aurora: 4 } },
];

export const ZONE_BY_ID: Record<ZoneId, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<
    ZoneId,
    ZoneDef
>;

export interface WeatherDef {
    kind: WeatherKind;
    minDuration: number;
    maxDuration: number;
    physical: number;
    ethereal: number;
    harmony: number;
    nightOnly: boolean;
}

export const WEATHER: Record<WeatherKind, WeatherDef> = {
    clear: { kind: 'clear', minDuration: 90, maxDuration: 200, physical: 1, ethereal: 1, harmony: 1, nightOnly: false },
    rain: { kind: 'rain', minDuration: 60, maxDuration: 150, physical: 1.3, ethereal: 1, harmony: 1, nightOnly: false },
    mist: { kind: 'mist', minDuration: 60, maxDuration: 150, physical: 1, ethereal: 1.3, harmony: 1, nightOnly: false },
    aurora: { kind: 'aurora', minDuration: 45, maxDuration: 100, physical: 1.5, ethereal: 1.5, harmony: 2, nightOnly: true },
};

export interface BuffDef {
    id: BuffId;
    duration: number;
    production: number;
    harmony: number;
    click: number;
}

export const BUFFS: Record<BuffId, BuffDef> = {
    drums: { id: 'drums', duration: 45, production: 2, harmony: 1, click: 1 },
    vigil: { id: 'vigil', duration: 90, production: 1, harmony: 3, click: 1 },
    serenity: { id: 'serenity', duration: 90, production: 1.5, harmony: 1, click: 1 },
    insight: { id: 'insight', duration: 60, production: 1, harmony: 1, click: 5 },
};
