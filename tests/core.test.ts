import { describe, expect, it } from 'vitest';
import {
    BALANCE_MULT_MIN,
    BALANCE_MULT_SPAN,
    HARMONY_WIDTH,
    advance,
    buyPerk,
    buyPlant,
    buyUpgrade,
    bulkCost,
    computeRates,
    createInitialState,
    gather,
    harmonyFactor,
    maxAffordable,
    normalizeState,
    pendingWisdom,
    performRitual,
    plantCost,
    resolveEvent,
    startNewCycle,
    travel,
    unlockZone,
    type GameState,
} from '../src/core';

const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...createInitialState(42, 0), tutorial: 99, ...patch });

describe('math', () => {
    it('bulk cost equals the sum of single costs', () => {
        let sum = 0;
        for (let i = 0; i < 25; i++) sum += 15 * Math.pow(1.15, 7 + i);
        expect(bulkCost(15, 1.15, 7, 25)).toBeCloseTo(sum, 6);
    });

    it('maxAffordable is the inverse of bulkCost', () => {
        for (const budget of [15, 100, 12_345, 1e9]) {
            const n = maxAffordable(15, 1.15, 3, budget);
            expect(bulkCost(15, 1.15, 3, n)).toBeLessThanOrEqual(budget);
            expect(bulkCost(15, 1.15, 3, n + 1)).toBeGreaterThan(budget);
        }
    });

    it('harmony is a bell curve centred on 50', () => {
        expect(harmonyFactor(50, HARMONY_WIDTH)).toBe(1);
        expect(harmonyFactor(50 + HARMONY_WIDTH, HARMONY_WIDTH)).toBeCloseTo(Math.exp(-1));
        expect(harmonyFactor(30, HARMONY_WIDTH)).toBeCloseTo(harmonyFactor(70, HARMONY_WIDTH));
    });
});

describe('economy', () => {
    it('balance is rewarded: equilibrium beats both extremes', () => {
        const base = fresh({ plants: { ...fresh().plants, lotus: 10, fern: 10 } });
        const centre = computeRates({ ...base, balance: 50 }).cps;
        expect(centre).toBeGreaterThan(computeRates({ ...base, balance: 0 }).cps);
        expect(centre).toBeGreaterThan(computeRates({ ...base, balance: 100 }).cps);
        expect(computeRates({ ...base, balance: 50 }).balanceMult).toBeCloseTo(BALANCE_MULT_MIN + BALANCE_MULT_SPAN);
    });

    it('a one-sided garden drifts out of balance', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 40 } });
        const after = advance(s, 600, { now: 0 }).state;
        expect(after.balance).toBeLessThan(25);
    });

    it('a mixed garden stays near the centre', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 30, fern: 6 } });
        const rates = computeRates(s);
        // Ethereal share of raw output decides the target.
        expect(Math.abs(rates.balanceTarget - (100 * rates.etherealRaw) / (rates.physicalRaw + rates.etherealRaw))).toBeLessThan(5);
    });

    it('zones change essence output', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 20 }, zones: ['grove', 'meadow'] });
        expect(computeRates({ ...s, zone: 'meadow' }).cps).toBeGreaterThan(computeRates(s).cps);
    });

    it('ancestral wisdom multiplies production', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 5 } });
        const boosted = { ...s, prestige: { wisdom: 10, spent: 0, perks: [] } };
        expect(computeRates(boosted).cps).toBeCloseTo(computeRates(s).cps * 1.2, 6);
    });
});

describe('simulation', () => {
    it('is deterministic for the same seed', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 10, fern: 5 } });
        const a = advance(s, 3600, { now: 0 }).state;
        const b = advance(s, 3600, { now: 0 }).state;
        expect(a.chi).toBe(b.chi);
        expect(a.weather).toEqual(b.weather);
        expect(a.rng).toBe(b.rng);
    });

    it('step size does not change the outcome much', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 10, fern: 3 } });
        const online = advance(s, 1200, { now: 0 }).state.chi;
        const offline = advance(s, 1200, { offline: true, efficiency: 1, now: 0 }).state.chi;
        expect(Math.abs(online - offline) / online).toBeLessThan(0.02);
    });

    it('offline efficiency scales gains and never spawns events', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 10 } });
        const full = advance(s, 3600, { offline: true, efficiency: 1, now: 0 });
        const half = advance(s, 3600, { offline: true, efficiency: 0.5, now: 0 });
        // Achievements (+1 % each) may unlock at slightly different moments.
        expect(Math.abs(half.chiGained / (full.chiGained / 2) - 1)).toBeLessThan(0.01);
        expect(full.state.activeEvent).toBeNull();
    });

    it('random events appear while online', () => {
        const s = fresh({ plants: { ...fresh().plants, lotus: 10 } });
        const after = advance(s, 1200, { now: 0 });
        expect(after.state.activeEvent).not.toBeNull();
        expect(after.signals.some((sig) => sig.type === 'event')).toBe(true);
    });

    it('buffs expire', () => {
        const s = fresh({ buffs: [{ id: 'drums', until: 40 }], worldTime: 30 });
        expect(advance(s, 20, { now: 0 }).state.buffs).toHaveLength(0);
    });
});

describe('actions', () => {
    it('gather adds chi and advances the tutorial', () => {
        const s = { ...fresh(), tutorial: 0 };
        const r = gather(s);
        expect(r.ok).toBe(true);
        expect(r.state.chi).toBeGreaterThan(s.chi);
        expect(r.state.tutorial).toBe(1);
    });

    it('buying plants deducts the exact bulk cost', () => {
        const s = fresh({ chi: 10_000 });
        const cost = bulkCost(15, 1.15, 0, 10);
        const r = buyPlant(s, 'lotus', 10);
        expect(r.ok).toBe(true);
        expect(r.state.plants.lotus).toBe(10);
        expect(r.state.chi).toBeCloseTo(10_000 - cost, 6);
        expect(plantCost(r.state, 'lotus')).toBeCloseTo(15 * Math.pow(1.15, 10));
    });

    it('rejects unaffordable or hidden purchases', () => {
        expect(buyPlant(fresh({ chi: 1 }), 'lotus').reason).toBe('insufficientChi');
        expect(buyPlant(fresh({ chi: 1e12 }), 'worldtree').reason).toBe('locked');
    });

    it('rituals respect cooldowns and shift balance', () => {
        const s = fresh({ chi: 1_000, plants: { ...fresh().plants, lotus: 5 } });
        const r = performRitual(s, 'meditation');
        expect(r.ok).toBe(true);
        expect(r.state.balance).toBe(65);
        expect(performRitual(r.state, 'meditation').reason).toBe('cooldown');
    });

    it('the offering trades chi for harmony and centres the garden', () => {
        const s = fresh({ chi: 1e6, balance: 20, stats: { ...fresh().stats, runChi: 1e6 } });
        const r = performRitual(s, 'offering');
        expect(r.ok).toBe(true);
        expect(r.state.chi).toBeCloseTo(750_000);
        expect(r.state.harmony).toBeGreaterThan(40);
        expect(r.state.balance).toBeCloseTo(38);
    });

    it('vigil only works at night', () => {
        const day = fresh({ chi: 1e6, stats: { ...fresh().stats, runHarmony: 10 }, worldTime: 150 });
        expect(performRitual(day, 'vigil').reason).toBe('notNight');
        expect(performRitual({ ...day, worldTime: 450 }, 'vigil').ok).toBe(true);
    });

    it('upgrades need visibility and currency', () => {
        const s = fresh({ chi: 1e6, plants: { ...fresh().plants, lotus: 10 } });
        const r = buyUpgrade(s, 'lotus-1');
        expect(r.ok).toBe(true);
        // ×2 from the upgrade (plus possibly +1 % from an achievement it unlocked).
        const ratio = computeRates(r.state).perPlant.lotus / computeRates(s).perPlant.lotus;
        expect(ratio).toBeGreaterThanOrEqual(2 - 1e-9);
        expect(ratio).toBeLessThan(2.05);
        expect(buyUpgrade(s, 'lotus-2').reason).toBe('locked');
    });

    it('zones unlock and travel', () => {
        const s = fresh({ chi: 30_000 });
        const r = unlockZone(s, 'meadow');
        expect(r.ok && r.state.zone === 'meadow').toBe(true);
        expect(travel(r.state, 'grove').state.zone).toBe('grove');
        expect(travel(r.state, 'peaks').reason).toBe('locked');
    });

    it('events resolve with their outcome', () => {
        const s = fresh({ activeEvent: 'deer', balance: 20 });
        const r = resolveEvent(s, 'follow');
        expect(r.ok).toBe(true);
        expect(r.state.activeEvent).toBeNull();
        expect(r.state.balance).toBeCloseTo(50);
    });

    it('a new cycle converts progress into wisdom and keeps perks', () => {
        const s = fresh({ stats: { ...fresh().stats, runChi: 4e10, runHarmony: 400 }, prestige: { wisdom: 3, spent: 1, perks: ['spiritKin'] } });
        const gain = pendingWisdom(s);
        expect(gain).toBeGreaterThan(0);
        const r = startNewCycle(s);
        expect(r.state.prestige.wisdom).toBe(3 + gain);
        expect(r.state.prestige.perks).toEqual(['spiritKin']);
        expect(r.state.plants.lotus).toBe(0);
        expect(r.state.stats.prestiges).toBe(1);
        expect(startNewCycle(fresh()).reason).toBe('nothingToGain');
    });

    it('perks cost available wisdom', () => {
        const s = fresh({ prestige: { wisdom: 2, spent: 0, perks: [] } });
        const r = buyPerk(s, 'ancestralRhythm');
        expect(r.ok).toBe(true);
        expect(buyPerk(r.state, 'seedMemory').reason).toBe('insufficientWisdom');
    });
});

describe('persistence', () => {
    it('round-trips a state through JSON', () => {
        const s = advance(fresh({ plants: { ...fresh().plants, lotus: 5 } }), 100, { now: 0 }).state;
        const restored = normalizeState(JSON.parse(JSON.stringify(s)), s.lastSeen);
        expect(restored.chi).toBeCloseTo(s.chi);
        expect(restored.plants).toEqual(s.plants);
        expect(restored.weather).toEqual(s.weather);
    });

    it('sanitises garbage', () => {
        const s = normalizeState({ schema: 2, chi: 'NaN', balance: 900, plants: { lotus: -4 }, upgrades: ['nope', 'gentleHands'] });
        expect(s.chi).toBe(15);
        expect(s.balance).toBe(100);
        expect(s.plants.lotus).toBe(0);
        expect(s.upgrades).toEqual(['gentleHands']);
    });

    it('migrates the v1 zustand save', () => {
        const legacy = {
            state: {
                chi: 5000,
                balance: 30,
                totalChi: 80_000,
                plants: { p1: { level: 12 }, p2: { level: 4 }, p3: { level: 2 }, p4: { level: 0 } },
                prestige: { points: 3, pendingPoints: 0 },
                lastUpdate: 1000,
            },
            version: 0,
        };
        const s = normalizeState(legacy, 2000);
        expect(s.plants.lotus).toBe(12);
        expect(s.plants.sunpetal).toBe(4);
        expect(s.plants.fern).toBe(2);
        expect(s.chi).toBe(5000);
        expect(s.prestige.wisdom).toBe(3);
        expect(s.tutorial).toBe(99);
    });
});
