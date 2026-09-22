// Economy: derives every rate of the garden from the (pure) game state.
//
//   cps_p   = baseCps_p · level_p · 2^milestones(level_p) · M_plant_p
//             · M_essence · M_zone · M_weather · M_daynight · M_tilt
//   cps     = Σ cps_p · M_balance · M_global · M_buffs
//   M_balance = MIN + SPAN · h(balance),  h = exp(-((b-50)/σ)²)
//
// Balance drifts towards the garden's natural target, which is the ethereal
// share of raw output. A one-sided garden therefore drifts out of harmony and
// loses up to ~45 % of its output — balance is rewarded, not extremes.

import {
    ACHIEVEMENT_BONUS,
    BALANCE_DRIFT_RATE,
    BALANCE_MULT_MIN,
    BALANCE_MULT_SPAN,
    CLICK_CPS_SHARE,
    CLICK_FLAT,
    DAY_LENGTH,
    DAYNIGHT_BALANCE_PUSH,
    ESSENCE_TILT,
    HARMONY_BASE_RATE,
    HARMONY_WIDTH,
    OFFLINE_BASE_CAP,
    OFFLINE_BASE_EFFICIENCY,
    PLANT_MILESTONES,
    WISDOM_BONUS,
    WISDOM_THRESHOLD,
} from './constants';
import { clamp, harmonyFactor, levelCost, smoothstep } from './math';
import type { Modifier } from './content/modifiers';
import { PERK_BY_ID } from './content/perks';
import { PLANTS, PLANT_BY_ID } from './content/plants';
import { RITUAL_BY_ID, type RitualId } from './content/rituals';
import { UPGRADE_BY_ID } from './content/upgrades';
import { BUFFS, WEATHER, ZONE_BY_ID } from './content/world';
import type { Essence, GameState, PlantId } from './types';

export interface Modifiers {
    plant: Partial<Record<PlantId, number>>;
    essence: Record<Essence, number>;
    global: number;
    clickShare: number;
    clickMult: number;
    harmonyMult: number;
    harmonyWidth: number;
    driftMult: number;
    cooldownMult: number;
    offlineCap: number;
    offlineEff: number;
    dayNightMult: number;
    weatherMult: number;
    costMult: number;
    eventRate: number;
    startChi: number;
    keepZones: boolean;
}

const baseModifiers = (): Modifiers => ({
    plant: {},
    essence: { physical: 1, ethereal: 1, neutral: 1 },
    global: 1,
    clickShare: CLICK_CPS_SHARE,
    clickMult: 1,
    harmonyMult: 1,
    harmonyWidth: HARMONY_WIDTH,
    driftMult: 1,
    cooldownMult: 1,
    offlineCap: OFFLINE_BASE_CAP,
    offlineEff: OFFLINE_BASE_EFFICIENCY,
    dayNightMult: 1,
    weatherMult: 1,
    costMult: 1,
    eventRate: 1,
    startChi: 0,
    keepZones: false,
});

const applyModifier = (mods: Modifiers, mod: Modifier) => {
    switch (mod.kind) {
        case 'plantMult':
            mods.plant[mod.plant] = (mods.plant[mod.plant] ?? 1) * mod.value;
            break;
        case 'essenceMult':
            mods.essence[mod.essence] *= mod.value;
            break;
        case 'globalMult':
            mods.global *= mod.value;
            break;
        case 'clickShare':
            mods.clickShare += mod.value;
            break;
        case 'clickMult':
            mods.clickMult *= mod.value;
            break;
        case 'harmonyMult':
            mods.harmonyMult *= mod.value;
            break;
        case 'harmonyWidth':
            mods.harmonyWidth += mod.value;
            break;
        case 'driftMult':
            mods.driftMult *= mod.value;
            break;
        case 'cooldownMult':
            mods.cooldownMult *= mod.value;
            break;
        case 'offlineCap':
            mods.offlineCap += mod.value;
            break;
        case 'offlineEff':
            mods.offlineEff += mod.value;
            break;
        case 'dayNightMult':
            mods.dayNightMult *= mod.value;
            break;
        case 'weatherMult':
            mods.weatherMult *= mod.value;
            break;
        case 'costMult':
            mods.costMult *= mod.value;
            break;
        case 'eventRate':
            mods.eventRate *= mod.value;
            break;
        case 'startChi':
            mods.startChi += mod.value;
            break;
        case 'keepZones':
            mods.keepZones = true;
            break;
    }
};

// Modifiers only change when upgrades/perks/achievements change, so cache them
// by the identity of those arrays (state updates are immutable).
let cacheKey: [string[], string[], string[], number] | null = null;
let cacheValue: Modifiers | null = null;

export const getModifiers = (state: GameState): Modifiers => {
    if (
        cacheKey &&
        cacheValue &&
        cacheKey[0] === state.upgrades &&
        cacheKey[1] === state.prestige.perks &&
        cacheKey[2] === state.achievements &&
        cacheKey[3] === state.prestige.wisdom
    ) {
        return cacheValue;
    }
    const mods = baseModifiers();
    for (const id of state.upgrades) {
        const def = UPGRADE_BY_ID[id];
        if (def) def.effects.forEach((m) => applyModifier(mods, m));
    }
    for (const id of state.prestige.perks) {
        const def = PERK_BY_ID[id];
        if (def) def.effects.forEach((m) => applyModifier(mods, m));
    }
    mods.global *= 1 + state.achievements.length * ACHIEVEMENT_BONUS;
    mods.global *= 1 + state.prestige.wisdom * WISDOM_BONUS;
    mods.offlineEff = Math.min(1, mods.offlineEff);
    cacheKey = [state.upgrades, state.prestige.perks, state.achievements, state.prestige.wisdom];
    cacheValue = mods;
    return mods;
};

// ---------------------------------------------------------------- Time of day

export interface DayInfo {
    /** 0..1 over the cycle; 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight */
    phase: number;
    /** sun elevation -1..1 */
    elevation: number;
    /** 0 (night) .. 1 (full day) */
    daylight: number;
    night: boolean;
}

export const getDayInfo = (worldTime: number): DayInfo => {
    const phase = (((worldTime % DAY_LENGTH) + DAY_LENGTH) % DAY_LENGTH) / DAY_LENGTH;
    const elevation = Math.sin(phase * Math.PI * 2);
    const daylight = smoothstep(-0.2, 0.25, elevation);
    return { phase, elevation, daylight, night: elevation < -0.1 };
};

// ---------------------------------------------------------------- Rates

export const plantMilestones = (level: number): number => PLANT_MILESTONES.filter((m) => level >= m).length;

export interface Rates {
    cps: number;
    perPlant: Record<PlantId, number>;
    /** raw (un-tilted) output per essence, used for the drift target */
    physicalRaw: number;
    etherealRaw: number;
    harmony: number;
    balanceMult: number;
    balanceTarget: number;
    driftRate: number;
    harmonyPerSecond: number;
    clickValue: number;
    productionBuff: number;
    day: DayInfo;
}

export const essenceTilt = (essence: Essence, balance: number): number => {
    if (essence === 'neutral') return 1;
    const t = (balance - 50) / 50; // -1..1
    return essence === 'ethereal' ? 1 + ESSENCE_TILT * t : 1 - ESSENCE_TILT * t;
};

export const activeBuffMult = (state: GameState, key: 'production' | 'harmony' | 'click'): number => {
    let mult = 1;
    for (const buff of state.buffs) {
        if (buff.until > state.worldTime) mult *= BUFFS[buff.id][key];
    }
    return mult;
};

export const computeRates = (state: GameState): Rates => {
    const mods = getModifiers(state);
    const zone = ZONE_BY_ID[state.zone] ?? ZONE_BY_ID.grove;
    const weather = WEATHER[state.weather.kind] ?? WEATHER.clear;
    const day = getDayInfo(state.worldTime);
    const weatherScale = (m: number) => 1 + (m - 1) * mods.weatherMult;
    const dayBonus = 0.1 * mods.dayNightMult;

    const essenceEnv: Record<Essence, number> = {
        physical: zone.physical * weatherScale(weather.physical) * (1 + dayBonus * day.daylight),
        ethereal: zone.ethereal * weatherScale(weather.ethereal) * (1 + dayBonus * (1 - day.daylight)),
        neutral: Math.sqrt(zone.physical * zone.ethereal) * weatherScale((weather.physical + weather.ethereal) / 2),
    };

    const perPlant = {} as Record<PlantId, number>;
    let physicalRaw = 0;
    let etherealRaw = 0;
    let sum = 0;
    for (const plant of PLANTS) {
        const level = state.plants[plant.id] ?? 0;
        if (level <= 0) {
            perPlant[plant.id] = 0;
            continue;
        }
        const raw = plant.baseCps * level * Math.pow(2, plantMilestones(level)) * (mods.plant[plant.id] ?? 1);
        if (plant.essence === 'physical') physicalRaw += raw;
        else if (plant.essence === 'ethereal') etherealRaw += raw;
        const value =
            raw * mods.essence[plant.essence] * essenceEnv[plant.essence] * essenceTilt(plant.essence, state.balance);
        perPlant[plant.id] = value;
        sum += value;
    }

    const harmony = harmonyFactor(state.balance, mods.harmonyWidth);
    const balanceMult = BALANCE_MULT_MIN + BALANCE_MULT_SPAN * harmony;
    const productionBuff = activeBuffMult(state, 'production');
    const factor = balanceMult * mods.global * productionBuff;
    for (const plant of PLANTS) perPlant[plant.id] *= factor;
    const cps = sum * factor;

    const totalRaw = physicalRaw + etherealRaw;
    const compositionTarget = totalRaw > 0 ? (100 * etherealRaw) / totalRaw : 50;
    const balanceTarget = clamp(compositionTarget + DAYNIGHT_BALANCE_PUSH * (1 - 2 * day.daylight), 0, 100);
    const driftRate = BALANCE_DRIFT_RATE * mods.driftMult;

    const harmonyPerSecond =
        harmony *
        harmony *
        HARMONY_BASE_RATE *
        (1 + Math.log10(1 + cps)) *
        zone.harmony *
        weatherScale(weather.harmony) *
        mods.harmonyMult *
        activeBuffMult(state, 'harmony');

    const clickValue = (CLICK_FLAT + cps * mods.clickShare) * mods.clickMult * activeBuffMult(state, 'click');

    return {
        cps,
        perPlant,
        physicalRaw,
        etherealRaw,
        harmony,
        balanceMult,
        balanceTarget,
        driftRate,
        harmonyPerSecond,
        clickValue,
        productionBuff,
        day,
    };
};

// ---------------------------------------------------------------- Costs

export const plantCost = (state: GameState, id: PlantId, level = state.plants[id]): number => {
    const def = PLANT_BY_ID[id];
    return levelCost(def.baseCost, def.growth, level) * getModifiers(state).costMult;
};

export const ritualCost = (state: GameState, id: RitualId, cps: number): number => {
    const def = RITUAL_BY_ID[id];
    if (def.currency === 'share') return state.chi * def.baseCost;
    if (def.currency === 'harmony') return def.baseCost;
    return Math.max(def.baseCost, cps * def.cpsSeconds);
};

export const ritualCooldown = (state: GameState, id: RitualId): number =>
    RITUAL_BY_ID[id].cooldown * getModifiers(state).cooldownMult;

export const isPlantRevealed = (state: GameState, id: PlantId): boolean => {
    if (state.plants[id] > 0) return true;
    const index = PLANTS.findIndex((p) => p.id === id);
    if (index === 0) return true;
    const previous = PLANTS[index - 1];
    return state.plants[previous.id] > 0 && state.stats.runChi >= PLANTS[index].baseCost * 0.3;
};

export const offlineLimits = (state: GameState) => {
    const mods = getModifiers(state);
    return { cap: mods.offlineCap, efficiency: mods.offlineEff };
};

/** Ancestral wisdom the player would receive by starting a new cycle now. */
export const pendingWisdom = (state: GameState): number => {
    const chiPart = Math.sqrt(state.stats.runChi / WISDOM_THRESHOLD);
    const harmonyPart = 1 + Math.sqrt(state.stats.runHarmony) / 20;
    const value = Math.floor(chiPart * harmonyPart);
    return Number.isFinite(value) && value > 0 ? value : 0;
};

/** runChi needed for the next wisdom point (assuming harmony stays constant). */
export const nextWisdomAt = (state: GameState): number => {
    const harmonyPart = 1 + Math.sqrt(state.stats.runHarmony) / 20;
    const next = pendingWisdom(state) + 1;
    return Math.pow(next / harmonyPart, 2) * WISDOM_THRESHOLD;
};
