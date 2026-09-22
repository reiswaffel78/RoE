// Fixed-step simulation. `advance` is pure from the outside: it clones the
// state once, mutates the private copy step by step, and returns it together
// with the signals that happened (achievements, weather changes, events).

import {
    EVENT_MAX_DELAY,
    EVENT_MIN_DELAY,
    EVENT_TUTORIAL_GATE,
    LOG_LIMIT,
    MAX_OFFLINE_STEP,
    MAX_STEP,
} from './constants';
import { ACHIEVEMENTS } from './content/achievements';
import { EVENTS } from './content/events';
import { WEATHER, ZONE_BY_ID } from './content/world';
import { computeRates, getDayInfo, getModifiers } from './economy';
import { approach, clamp } from './math';
import { Rng } from './rng';
import type { GameSignal, GameState, LogEntry, WeatherKind } from './types';

export interface AdvanceOptions {
    /** Offline catch-up: reduced efficiency, no random events, coarser steps. */
    offline?: boolean;
    efficiency?: number;
    now?: number;
}

export interface AdvanceResult {
    state: GameState;
    signals: GameSignal[];
    chiGained: number;
    harmonyGained: number;
}

export const pushLog = (state: GameState, entry: Omit<LogEntry, 'at'>, now = Date.now()): LogEntry[] => {
    const log = [...state.log, { ...entry, at: now }];
    return log.length > LOG_LIMIT ? log.slice(log.length - LOG_LIMIT) : log;
};

const rollWeather = (s: GameState, rng: Rng): WeatherKind => {
    const zone = ZONE_BY_ID[s.zone] ?? ZONE_BY_ID.grove;
    const night = getDayInfo(s.worldTime).night;
    const weights = { ...zone.weather };
    if (!night) weights.aurora = 0;
    // Avoid the same weather twice in a row unless it is clear sky.
    if (s.weather.kind !== 'clear') weights[s.weather.kind] *= 0.35;
    return rng.pickWeighted(weights);
};

export const scheduleNextEvent = (s: GameState, rng: Rng): number => {
    const rate = getModifiers(s).eventRate;
    return s.worldTime + rng.range(EVENT_MIN_DELAY, EVENT_MAX_DELAY) / rate;
};

const pickEvent = (s: GameState, rng: Rng): string | null => {
    const night = getDayInfo(s.worldTime).night;
    const eligible = EVENTS.filter((e) => !e.condition || e.condition(s, { night }));
    if (eligible.length === 0) return null;
    const weights = Object.fromEntries(eligible.map((e) => [e.id, e.weight]));
    return rng.pickWeighted(weights);
};

export const checkAchievements = (s: GameState, cps: number, signals: GameSignal[], now: number): void => {
    let unlocked: string[] | null = null;
    for (const def of ACHIEVEMENTS) {
        if (s.achievements.includes(def.id)) continue;
        let ok = false;
        try {
            ok = def.check({ state: s, cps });
        } catch {
            ok = false;
        }
        if (ok) {
            unlocked = unlocked ?? [...s.achievements];
            unlocked.push(def.id);
            signals.push({ type: 'achievement', id: def.id });
            s.log = pushLog(s, { key: 'achievement', params: { id: def.id } }, now);
        }
    }
    if (unlocked) s.achievements = unlocked;
};

const step = (s: GameState, dt: number, rng: Rng, opts: Required<AdvanceOptions>, signals: GameSignal[]) => {
    const rates = computeRates(s);
    const eff = opts.offline ? opts.efficiency : 1;

    const chiGain = rates.cps * dt * eff;
    const harmonyGain = rates.harmonyPerSecond * dt * eff;
    s.chi += chiGain;
    s.harmony += harmonyGain;
    s.stats.runChi += chiGain;
    s.stats.lifetimeChi += chiGain;
    s.stats.runHarmony += harmonyGain;
    s.stats.maxCps = Math.max(s.stats.maxCps, rates.cps);

    s.balance = clamp(approach(s.balance, rates.balanceTarget, rates.driftRate, dt), 0, 100);
    s.worldTime += dt;
    s.stats.playTime += dt;

    if (rates.harmony >= 0.9) {
        s.stats.harmonyStreak += dt;
        s.stats.bestHarmonyStreak = Math.max(s.stats.bestHarmonyStreak, s.stats.harmonyStreak);
    } else {
        s.stats.harmonyStreak = 0;
    }

    if (s.buffs.some((b) => b.until <= s.worldTime)) {
        for (const b of s.buffs) {
            if (b.until <= s.worldTime && !opts.offline) signals.push({ type: 'buffEnded', id: b.id });
        }
        s.buffs = s.buffs.filter((b) => b.until > s.worldTime);
    }

    if (s.worldTime >= s.weather.until) {
        const kind = rollWeather(s, rng);
        const def = WEATHER[kind];
        s.weather = { kind, until: s.worldTime + rng.range(def.minDuration, def.maxDuration) };
        if (kind === 'aurora') {
            s.stats.auroras += 1;
            s.log = pushLog(s, { key: 'aurora' }, opts.now);
        }
        if (!opts.offline) signals.push({ type: 'weather', kind });
    }

    if (s.worldTime >= s.nextEventAt) {
        if (opts.offline || s.tutorial < EVENT_TUTORIAL_GATE || s.activeEvent) {
            s.nextEventAt = scheduleNextEvent(s, rng);
        } else {
            const id = pickEvent(s, rng);
            if (id) {
                s.activeEvent = id;
                signals.push({ type: 'event', id });
                s.log = pushLog(s, { key: 'eventAppeared', params: { id } }, opts.now);
            }
            s.nextEventAt = scheduleNextEvent(s, rng);
        }
    }

    return { chiGain, harmonyGain, cps: rates.cps };
};

export const advance = (input: GameState, deltaSeconds: number, options: AdvanceOptions = {}): AdvanceResult => {
    const opts: Required<AdvanceOptions> = {
        offline: options.offline ?? false,
        efficiency: clamp(options.efficiency ?? 1, 0, 1),
        now: options.now ?? Date.now(),
    };
    const signals: GameSignal[] = [];
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
        return { state: input, signals, chiGained: 0, harmonyGained: 0 };
    }

    const s: GameState = {
        ...input,
        stats: { ...input.stats },
        weather: { ...input.weather },
    };
    const rng = new Rng(s.rng);
    const maxStep = opts.offline ? MAX_OFFLINE_STEP : MAX_STEP;

    let remaining = deltaSeconds;
    let chiGained = 0;
    let harmonyGained = 0;
    let sinceAchievementCheck = 0;
    let lastCps = 0;
    while (remaining > 1e-9) {
        const dt = Math.min(maxStep, remaining);
        const result = step(s, dt, rng, opts, signals);
        chiGained += result.chiGain;
        harmonyGained += result.harmonyGain;
        lastCps = result.cps;
        remaining -= dt;
        sinceAchievementCheck += dt;
        if (!opts.offline || sinceAchievementCheck >= 60) {
            checkAchievements(s, result.cps, signals, opts.now);
            sinceAchievementCheck = 0;
        }
    }
    if (opts.offline) checkAchievements(s, lastCps, signals, opts.now);

    s.rng = rng.state;
    return { state: s, signals, chiGained, harmonyGained };
};
