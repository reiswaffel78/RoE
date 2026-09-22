// Headless player bot used to verify pacing corridors (PDR §30).
import {
    PLANTS,
    RITUALS,
    UPGRADES,
    ZONES,
    advance,
    buyPlant,
    buyUpgrade,
    computeRates,
    createInitialState,
    gather,
    isPlantRevealed,
    pendingWisdom,
    performRitual,
    plantCost,
    resolveEvent,
    ritualStatus,
    travel,
    unlockZone,
    EVENT_BY_ID,
    type GameState,
    type PlantId,
} from '../src/core';

export interface Milestone {
    label: string;
    at: number;
}

export interface BotOptions {
    seconds: number;
    clicksPerSecond: (t: number) => number;
    seed?: number;
    /** keep balance in mind (true) or buy purely greedy (false) */
    mindful?: boolean;
}

const marginalGain = (state: GameState, id: PlantId): number => {
    const before = computeRates(state).cps;
    const after = computeRates({ ...state, plants: { ...state.plants, [id]: state.plants[id] + 1 } }).cps;
    return Math.max(1e-9, after - before);
};

export const runBot = (opts: BotOptions) => {
    let s = createInitialState(opts.seed ?? 1234, 0);
    s.tutorial = 99;
    const milestones: Milestone[] = [];
    const mark = (label: string, t: number) => {
        if (!milestones.some((m) => m.label === label)) milestones.push({ label, at: t });
    };
    let harmonySum = 0;

    for (let t = 0; t < opts.seconds; t++) {
        const clicks = opts.clicksPerSecond(t);
        for (let c = 0; c < clicks; c++) s = gather(s).state;
        s = advance(s, 1, { now: 0 }).state;
        const rates = computeRates(s);
        harmonySum += rates.harmony;

        if (s.activeEvent) s = resolveEvent(s, EVENT_BY_ID[s.activeEvent].choices[0].id).state;

        // Rituals: keep balance, drum whenever possible.
        if (opts.mindful !== false) {
            if (s.balance < 40 && ritualStatus(s, 'meditation', rates.cps).ready) s = performRitual(s, 'meditation').state;
            if (s.balance > 60 && ritualStatus(s, 'grounding', rates.cps).ready) s = performRitual(s, 'grounding').state;
        }
        if (ritualStatus(s, 'drums', rates.cps).ready) s = performRitual(s, 'drums').state;
        if (ritualStatus(s, 'vigil', rates.cps).ready) s = performRitual(s, 'vigil').state;

        // Upgrades first (cheap relative to income).
        for (const u of UPGRADES) {
            if (s.upgrades.includes(u.id) || !u.visible(s)) continue;
            const wallet = u.currency === 'chi' ? s.chi : s.harmony;
            if (wallet >= u.cost) s = buyUpgrade(s, u.id).state;
        }

        // Zones: unlock when it costs less than 10 minutes of production.
        for (const z of ZONES) {
            if (!s.zones.includes(z.id) && s.chi >= z.cost && z.cost < rates.cps * 600 + 1) {
                s = unlockZone(s, z.id).state;
                mark(`zone:${z.id}`, t);
            }
        }
        // Travel to the zone with the highest cps.
        let bestZone = s.zone;
        let bestCps = computeRates(s).cps;
        for (const id of s.zones) {
            const c = computeRates({ ...s, zone: id }).cps;
            if (c > bestCps * 1.02) {
                bestCps = c;
                bestZone = id;
            }
        }
        if (bestZone !== s.zone) s = travel(s, bestZone).state;

        // Plants: best payback, with a balance-aware nudge.
        for (let guard = 0; guard < 50; guard++) {
            let best: PlantId | null = null;
            let bestScore = Infinity;
            for (const p of PLANTS) {
                if (!isPlantRevealed(s, p.id)) continue;
                const cost = plantCost(s, p.id);
                let score = cost / marginalGain(s, p.id);
                if (opts.mindful !== false) {
                    if (s.balance < 45 && p.essence === 'ethereal') score *= 0.6;
                    if (s.balance > 55 && p.essence === 'physical') score *= 0.6;
                }
                if (score < bestScore) {
                    bestScore = score;
                    best = p.id;
                }
            }
            if (!best || plantCost(s, best) > s.chi) break;
            s = buyPlant(s, best, 1).state;
            mark(`plant:${best}`, t);
        }

        if (RITUALS.every((r) => r.unlocked(s))) mark('allRituals', t);
        if (s.stats.runChi >= 1e6) mark('chi:1M', t);
        if (s.stats.runChi >= 1e9) mark('chi:1B', t);
        if (pendingWisdom(s) >= 1) mark('wisdom:1', t);
        if (pendingWisdom(s) >= 10) mark('wisdom:10', t);
    }
    return { state: s, milestones, avgHarmony: harmonySum / opts.seconds };
};
