// Player actions as pure reducers: (state, args) -> result.

import { EVENT_BY_ID } from './content/events';
import { PERK_BY_ID } from './content/perks';
import { PLANT_BY_ID } from './content/plants';
import {
    OFFERING_CENTERING,
    RAIN_DANCE_DURATION,
    RITUAL_BALANCE_SHIFT,
    RITUAL_BY_ID,
    offeringHarmony,
    type RitualId,
} from './content/rituals';
import { UPGRADE_BY_ID } from './content/upgrades';
import { BUFFS, ZONE_BY_ID } from './content/world';
import {
    computeRates,
    getDayInfo,
    getModifiers,
    isPlantRevealed,
    pendingWisdom,
    ritualCooldown,
    ritualCost,
} from './economy';
import { bulkCost, clamp, maxAffordable } from './math';
import { Rng } from './rng';
import { checkAchievements, pushLog, scheduleNextEvent } from './simulation';
import { createInitialState, emptyStats } from './state';
import { EVENTS } from './content/events';
import type { BuffId, GameSignal, GameState, PlantId, ZoneId } from './types';

export type FailReason =
    | 'unknown'
    | 'insufficientChi'
    | 'insufficientHarmony'
    | 'insufficientWisdom'
    | 'locked'
    | 'owned'
    | 'cooldown'
    | 'notNight'
    | 'busy'
    | 'nothingToGain';

export interface ActionResult {
    state: GameState;
    ok: boolean;
    reason?: FailReason;
    /** chi / harmony amount relevant to the action (for floating numbers) */
    amount?: number;
    count?: number;
    signals: GameSignal[];
}

const fail = (state: GameState, reason: FailReason): ActionResult => ({ state, ok: false, reason, signals: [] });

const finish = (state: GameState, extra: Partial<ActionResult> = {}): ActionResult => {
    const signals: GameSignal[] = [...(extra.signals ?? [])];
    const cps = computeRates(state).cps;
    checkAchievements(state, cps, signals, Date.now());
    return { ok: true, ...extra, state, signals };
};

const addBuff = (state: GameState, id: BuffId): GameState['buffs'] => {
    const until = state.worldTime + BUFFS[id].duration;
    const existing = state.buffs.find((b) => b.id === id);
    if (existing) return state.buffs.map((b) => (b.id === id ? { ...b, until: Math.max(b.until, until) } : b));
    return [...state.buffs, { id, until }];
};

// --------------------------------------------------------------------- gather

export const gather = (state: GameState): ActionResult => {
    const value = computeRates(state).clickValue;
    const next: GameState = {
        ...state,
        chi: state.chi + value,
        stats: {
            ...state.stats,
            clicks: state.stats.clicks + 1,
            clickChi: state.stats.clickChi + value,
            runChi: state.stats.runChi + value,
            lifetimeChi: state.stats.lifetimeChi + value,
        },
        tutorial: state.tutorial === 0 ? 1 : state.tutorial,
    };
    return finish(next, { amount: value });
};

// --------------------------------------------------------------------- plants

export type BuyAmount = 1 | 10 | 25 | 'max';

export const plantPurchase = (state: GameState, id: PlantId, amount: BuyAmount) => {
    const def = PLANT_BY_ID[id];
    const level = state.plants[id];
    const costMult = getModifiers(state).costMult;
    const count =
        amount === 'max' ? Math.max(1, maxAffordable(def.baseCost * costMult, def.growth, level, state.chi)) : amount;
    const cost = bulkCost(def.baseCost * costMult, def.growth, level, count);
    return { count, cost, affordable: state.chi >= cost };
};

export const buyPlant = (state: GameState, id: PlantId, amount: BuyAmount = 1): ActionResult => {
    if (!PLANT_BY_ID[id]) return fail(state, 'unknown');
    if (!isPlantRevealed(state, id)) return fail(state, 'locked');
    const { count, cost, affordable } = plantPurchase(state, id, amount);
    if (!affordable) return fail(state, 'insufficientChi');
    const ownedTypes = Object.values(state.plants).filter((l) => l > 0).length;
    let tutorial = state.tutorial;
    if (tutorial === 1) tutorial = 2;
    else if (tutorial === 2 && state.plants[id] === 0 && ownedTypes >= 1) tutorial = 3;
    const next: GameState = {
        ...state,
        chi: state.chi - cost,
        plants: { ...state.plants, [id]: state.plants[id] + count },
        tutorial,
    };
    return finish(next, { amount: cost, count });
};

// --------------------------------------------------------------------- upgrades

export const buyUpgrade = (state: GameState, id: string): ActionResult => {
    const def = UPGRADE_BY_ID[id];
    if (!def) return fail(state, 'unknown');
    if (state.upgrades.includes(id)) return fail(state, 'owned');
    if (!def.visible(state)) return fail(state, 'locked');
    if (def.currency === 'chi' && state.chi < def.cost) return fail(state, 'insufficientChi');
    if (def.currency === 'harmony' && state.harmony < def.cost) return fail(state, 'insufficientHarmony');
    const next: GameState = {
        ...state,
        chi: def.currency === 'chi' ? state.chi - def.cost : state.chi,
        harmony: def.currency === 'harmony' ? state.harmony - def.cost : state.harmony,
        upgrades: [...state.upgrades, id],
    };
    next.log = pushLog(next, { key: 'upgrade', params: { id } });
    return finish(next, { amount: def.cost });
};

// --------------------------------------------------------------------- rituals

export const ritualStatus = (state: GameState, id: RitualId, cps: number) => {
    const def = RITUAL_BY_ID[id];
    const cost = ritualCost(state, id, cps);
    const readyAt = state.cooldowns[id] ?? 0;
    const remaining = Math.max(0, readyAt - state.worldTime);
    const night = getDayInfo(state.worldTime).night;
    const unlocked = def.unlocked(state);
    const affordable =
        def.currency === 'harmony' ? state.harmony >= cost : def.currency === 'share' ? state.chi >= 10 : state.chi >= cost;
    let reason: FailReason | undefined;
    if (!unlocked) reason = 'locked';
    else if (remaining > 0) reason = 'cooldown';
    else if (def.nightOnly && !night) reason = 'notNight';
    else if (id === 'spiritCall' && state.activeEvent) reason = 'busy';
    else if (!affordable) reason = def.currency === 'harmony' ? 'insufficientHarmony' : 'insufficientChi';
    return { cost, remaining, unlocked, ready: reason === undefined, reason };
};

export const performRitual = (state: GameState, id: RitualId): ActionResult => {
    const def = RITUAL_BY_ID[id];
    if (!def) return fail(state, 'unknown');
    const rates = computeRates(state);
    const status = ritualStatus(state, id, rates.cps);
    if (!status.ready) return fail(state, status.reason ?? 'unknown');

    const s: GameState = {
        ...state,
        stats: { ...state.stats, rituals: state.stats.rituals + 1 },
        cooldowns: { ...state.cooldowns, [id]: state.worldTime + ritualCooldown(state, id) },
    };
    if (def.currency === 'harmony') s.harmony -= status.cost;
    else s.chi -= status.cost;

    const signals: GameSignal[] = [];
    let amount = status.cost;
    switch (id) {
        case 'meditation':
            s.balance = clamp(s.balance + RITUAL_BALANCE_SHIFT, 0, 100);
            break;
        case 'grounding':
            s.balance = clamp(s.balance - RITUAL_BALANCE_SHIFT, 0, 100);
            break;
        case 'drums':
            s.buffs = addBuff(s, 'drums');
            break;
        case 'vigil':
            s.buffs = addBuff(s, 'vigil');
            break;
        case 'offering': {
            const gained = offeringHarmony(status.cost);
            s.harmony += gained;
            s.stats.runHarmony += gained;
            s.stats.offerings += 1;
            s.balance += (50 - s.balance) * OFFERING_CENTERING;
            amount = gained;
            break;
        }
        case 'rainDance':
            s.weather = { kind: 'rain', until: s.worldTime + RAIN_DANCE_DURATION };
            signals.push({ type: 'weather', kind: 'rain' });
            break;
        case 'spiritCall': {
            const rng = new Rng(s.rng);
            const night = getDayInfo(s.worldTime).night;
            const eligible = EVENTS.filter((e) => !e.condition || e.condition(s, { night }));
            const picked = rng.pickWeighted(Object.fromEntries(eligible.map((e) => [e.id, e.weight])));
            s.rng = rng.state;
            s.activeEvent = picked;
            signals.push({ type: 'event', id: picked });
            break;
        }
    }
    s.log = pushLog(s, { key: 'ritual', params: { id } });
    return finish(s, { amount, signals });
};

// --------------------------------------------------------------------- zones

export const unlockZone = (state: GameState, id: ZoneId): ActionResult => {
    const def = ZONE_BY_ID[id];
    if (!def) return fail(state, 'unknown');
    if (state.zones.includes(id)) return fail(state, 'owned');
    if (state.chi < def.cost) return fail(state, 'insufficientChi');
    const next: GameState = { ...state, chi: state.chi - def.cost, zones: [...state.zones, id], zone: id };
    next.log = pushLog(next, { key: 'zoneUnlocked', params: { id } });
    return finish(next, { amount: def.cost, signals: [] });
};

export const travel = (state: GameState, id: ZoneId): ActionResult => {
    if (!state.zones.includes(id)) return fail(state, 'locked');
    if (state.zone === id) return fail(state, 'owned');
    const next: GameState = { ...state, zone: id };
    next.log = pushLog(next, { key: 'travel', params: { id } });
    return finish(next);
};

// --------------------------------------------------------------------- events

export const resolveEvent = (state: GameState, choiceId: string): ActionResult => {
    if (!state.activeEvent) return fail(state, 'unknown');
    const def = EVENT_BY_ID[state.activeEvent];
    const choice = def?.choices.find((c) => c.id === choiceId);
    if (!def || !choice) return fail(state, 'unknown');
    const { cps } = computeRates(state);
    const o = choice.outcome;
    const s: GameState = {
        ...state,
        stats: { ...state.stats, eventsResolved: state.stats.eventsResolved + 1 },
        activeEvent: null,
    };
    const signals: GameSignal[] = [];
    let amount = 0;
    if (o.chiSeconds) {
        const gain = Math.max(o.chiMin ?? 0, cps * o.chiSeconds);
        s.chi += gain;
        s.stats.runChi += gain;
        s.stats.lifetimeChi += gain;
        amount = gain;
    }
    if (o.chiShare) {
        const given = s.chi * o.chiShare;
        s.chi -= given;
        s.stats.offerings += 1;
    }
    if (o.harmonyFlat || o.harmonyPerLog) {
        const gain = (o.harmonyFlat ?? 0) + (o.harmonyPerLog ?? 0) * Math.log10(1 + cps);
        s.harmony += gain;
        s.stats.runHarmony += gain;
        amount = amount || gain;
    }
    if (o.balanceShift) s.balance = clamp(s.balance + o.balanceShift, 0, 100);
    if (o.balanceCenter) s.balance += (50 - s.balance) * o.balanceCenter;
    if (o.buff) s.buffs = addBuff(s, o.buff);
    if (o.weather) {
        s.weather = { kind: o.weather, until: s.worldTime + (o.weatherSeconds ?? 120) };
        signals.push({ type: 'weather', kind: o.weather });
    }
    const rng = new Rng(s.rng);
    s.nextEventAt = scheduleNextEvent(s, rng);
    s.rng = rng.state;
    s.log = pushLog(s, { key: 'eventResolved', params: { id: def.id, choice: choiceId } });
    return finish(s, { amount, signals });
};

// --------------------------------------------------------------------- tutorial

export const advanceTutorial = (state: GameState, to: number): GameState =>
    to > state.tutorial ? { ...state, tutorial: to } : state;

// --------------------------------------------------------------------- prestige

export const startNewCycle = (state: GameState): ActionResult => {
    const gain = pendingWisdom(state);
    if (gain <= 0) return fail(state, 'nothingToGain');
    const mods = getModifiers(state);
    const fresh = createInitialState(state.rng, Date.now());
    const next: GameState = {
        ...fresh,
        chi: fresh.chi + mods.startChi,
        worldTime: state.worldTime,
        weather: state.weather,
        nextEventAt: state.worldTime + 240,
        achievements: state.achievements,
        prestige: { ...state.prestige, wisdom: state.prestige.wisdom + gain },
        zones: mods.keepZones ? state.zones : ['grove'],
        zone: mods.keepZones ? state.zone : 'grove',
        tutorial: 99,
        stats: {
            ...emptyStats(),
            lifetimeChi: state.stats.lifetimeChi,
            clicks: state.stats.clicks,
            clickChi: state.stats.clickChi,
            rituals: state.stats.rituals,
            eventsResolved: state.stats.eventsResolved,
            playTime: state.stats.playTime,
            bestHarmonyStreak: state.stats.bestHarmonyStreak,
            maxCps: state.stats.maxCps,
            auroras: state.stats.auroras,
            offerings: state.stats.offerings,
            prestiges: state.stats.prestiges + 1,
        },
    };
    next.log = pushLog(next, { key: 'newCycle', params: { wisdom: gain } });
    return finish(next, { amount: gain });
};

export const buyPerk = (state: GameState, id: string): ActionResult => {
    const def = PERK_BY_ID[id];
    if (!def) return fail(state, 'unknown');
    if (state.prestige.perks.includes(id)) return fail(state, 'owned');
    const available = state.prestige.wisdom - state.prestige.spent;
    if (available < def.cost) return fail(state, 'insufficientWisdom');
    const next: GameState = {
        ...state,
        prestige: {
            ...state.prestige,
            spent: state.prestige.spent + def.cost,
            perks: [...state.prestige.perks, id],
        },
    };
    // A perk that grants start chi applies immediately once.
    const startChi = def.effects.find((e) => e.kind === 'startChi');
    if (startChi && startChi.kind === 'startChi') next.chi += startChi.value;
    next.log = pushLog(next, { key: 'perk', params: { id } });
    return finish(next);
};
