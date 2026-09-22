// Initial state, validation and save migration.

import { SCHEMA_VERSION } from './constants';
import { ACHIEVEMENT_BY_ID } from './content/achievements';
import { PERK_BY_ID } from './content/perks';
import { PLANT_IDS } from './content/plants';
import { UPGRADE_BY_ID } from './content/upgrades';
import { LEGACY_ZONES, WEATHER, ZONE_BY_ID } from './content/world';
import { EVENT_BY_ID } from './content/events';
import { clamp } from './math';
import { seedFromTime } from './rng';
import type { ActiveBuff, BuffId, GameState, GameStats, LogEntry, PlantId, PrestigeState, WeatherKind, ZoneId } from './types';
import { BUFFS } from './content/world';

export const emptyPlants = (): Record<PlantId, number> =>
    Object.fromEntries(PLANT_IDS.map((id) => [id, 0])) as Record<PlantId, number>;

export const emptyStats = (): GameStats => ({
    runChi: 0,
    lifetimeChi: 0,
    runHarmony: 0,
    clicks: 0,
    clickChi: 0,
    rituals: 0,
    eventsResolved: 0,
    prestiges: 0,
    playTime: 0,
    harmonyStreak: 0,
    bestHarmonyStreak: 0,
    maxCps: 0,
    auroras: 0,
    offerings: 0,
});

export const createInitialState = (seed = seedFromTime(), now = Date.now()): GameState => ({
    schema: SCHEMA_VERSION,
    chi: 15,
    harmony: 0,
    balance: 50,
    plants: emptyPlants(),
    upgrades: [],
    zones: ['grove'],
    zone: 'grove',
    buffs: [],
    cooldowns: {},
    weather: { kind: 'clear', until: 120 },
    // Start shortly after sunrise so the first impression is a bright morning.
    worldTime: 30,
    rng: seed >>> 0,
    nextEventAt: 240,
    activeEvent: null,
    achievements: [],
    stats: emptyStats(),
    prestige: { wisdom: 0, spent: 0, perks: [] },
    log: [{ at: now, key: 'welcome' }],
    tutorial: 0,
    lastSeen: now,
});

// ------------------------------------------------------------------ helpers

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_VALUE): number => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? clamp(n, min, max) : fallback;
};
const strArray = (v: unknown, valid: (s: string) => boolean): string[] =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && valid(x)))] : [];

const normalizeStats = (raw: unknown): GameStats => {
    const base = emptyStats();
    if (!isObject(raw)) return base;
    const out = { ...base };
    for (const key of Object.keys(base) as (keyof GameStats)[]) out[key] = num(raw[key], base[key]);
    return out;
};

const normalizePrestige = (raw: unknown): PrestigeState => {
    if (!isObject(raw)) return { wisdom: 0, spent: 0, perks: [] };
    const perks = strArray(raw.perks, (id) => id in PERK_BY_ID);
    const wisdom = Math.floor(num(raw.wisdom, 0));
    const spent = perks.reduce((sum, id) => sum + PERK_BY_ID[id].cost, 0);
    return { wisdom, spent: Math.min(spent, wisdom), perks };
};

const normalizeLog = (raw: unknown, now: number): LogEntry[] => {
    if (!Array.isArray(raw)) return [{ at: now, key: 'welcome' }];
    const entries = raw
        .filter((e): e is Record<string, unknown> => isObject(e) && typeof e.key === 'string')
        .map((e) => ({
            at: num(e.at, now),
            key: String(e.key),
            params: isObject(e.params) ? (e.params as LogEntry['params']) : undefined,
        }));
    return entries.length ? entries.slice(-80) : [{ at: now, key: 'welcome' }];
};

/** Migrates the v1 save ("zen-garden-save", zustand persist format). */
export const migrateV1 = (raw: Record<string, unknown>, now = Date.now()): GameState => {
    const legacy = isObject(raw.state) ? raw.state : raw;
    const state = createInitialState(seedFromTime(), now);
    const legacyPlants = isObject(legacy.plants) ? legacy.plants : {};
    const levelOf = (id: string) => {
        const p = legacyPlants[id];
        return isObject(p) ? Math.floor(num(p.level, 0, 0, 10_000)) : 0;
    };
    state.plants.lotus = levelOf('p1');
    state.plants.sunpetal = levelOf('p2');
    state.plants.fern = levelOf('p3');
    state.plants.dreamwood = levelOf('p4');
    state.chi = num(legacy.chi, 15);
    state.balance = num(legacy.balance, 50, 0, 100);
    state.stats.runChi = num(legacy.totalChi, 0);
    state.stats.lifetimeChi = state.stats.runChi;
    state.stats.playTime = num(legacy.playTime, 0);
    const prestige = isObject(legacy.prestige) ? legacy.prestige : {};
    state.prestige.wisdom = Math.floor(num(prestige.points, 0));
    state.lastSeen = num(legacy.lastUpdate, now, 0, now);
    // Veterans skip the tutorial.
    state.tutorial = state.stats.runChi > 0 ? 99 : 0;
    state.log = [{ at: now, key: 'migrated' }];
    return state;
};

/** Validates any parsed JSON into a well-formed GameState. Never throws. */
export const normalizeState = (raw: unknown, now = Date.now()): GameState => {
    if (!isObject(raw)) return createInitialState(seedFromTime(), now);
    if (raw.schema === undefined) return migrateV1(raw, now);

    const base = createInitialState(seedFromTime(), now);
    const plants = emptyPlants();
    if (isObject(raw.plants)) {
        for (const id of PLANT_IDS) plants[id] = Math.floor(num(raw.plants[id], 0, 0, 100_000));
    }
    const migrateZone = (id: unknown) => (typeof id === 'string' ? (LEGACY_ZONES[id] ?? id) : id);
    const zoneList = Array.isArray(raw.zones) ? raw.zones.map(migrateZone) : [];
    const zones = strArray(zoneList, (id) => id in ZONE_BY_ID) as ZoneId[];
    if (!zones.includes('grove')) zones.unshift('grove');
    const rawZone = migrateZone(raw.zone);
    const zone = typeof rawZone === 'string' && zones.includes(rawZone as ZoneId) ? (rawZone as ZoneId) : 'grove';
    const worldTime = num(raw.worldTime, base.worldTime);

    const weatherRaw = isObject(raw.weather) ? raw.weather : {};
    const weatherKind = (typeof weatherRaw.kind === 'string' && weatherRaw.kind in WEATHER
        ? weatherRaw.kind
        : 'clear') as WeatherKind;

    const buffs: ActiveBuff[] = Array.isArray(raw.buffs)
        ? raw.buffs
              .filter((b): b is Record<string, unknown> => isObject(b) && typeof b.id === 'string' && b.id in BUFFS)
              .map((b) => ({ id: b.id as BuffId, until: num(b.until, 0) }))
              .filter((b) => b.until > worldTime)
        : [];

    const cooldowns: Record<string, number> = {};
    if (isObject(raw.cooldowns)) {
        for (const [key, value] of Object.entries(raw.cooldowns)) {
            const n = num(value, 0);
            if (n > worldTime) cooldowns[key] = n;
        }
    }

    return {
        schema: SCHEMA_VERSION,
        chi: num(raw.chi, base.chi),
        harmony: num(raw.harmony, 0),
        balance: num(raw.balance, 50, 0, 100),
        plants,
        upgrades: strArray(raw.upgrades, (id) => id in UPGRADE_BY_ID),
        zones,
        zone,
        buffs,
        cooldowns,
        weather: { kind: weatherKind, until: num(weatherRaw.until, worldTime + 60) },
        worldTime,
        rng: Math.floor(num(raw.rng, base.rng, 0, 0xffffffff)) >>> 0,
        nextEventAt: num(raw.nextEventAt, worldTime + 240),
        activeEvent: typeof raw.activeEvent === 'string' && raw.activeEvent in EVENT_BY_ID ? raw.activeEvent : null,
        achievements: strArray(raw.achievements, (id) => id in ACHIEVEMENT_BY_ID),
        stats: normalizeStats(raw.stats),
        prestige: normalizePrestige(raw.prestige),
        log: normalizeLog(raw.log, now),
        tutorial: Math.floor(num(raw.tutorial, 0, 0, 99)),
        lastSeen: num(raw.lastSeen, now, 0, now),
    };
};
