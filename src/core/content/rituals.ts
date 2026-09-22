import type { GameState } from '../types';

export type RitualId = 'meditation' | 'grounding' | 'drums' | 'offering' | 'rainDance' | 'vigil' | 'spiritCall';

export interface RitualDef {
    id: RitualId;
    currency: 'chi' | 'harmony' | 'share';
    /** Minimum cost (chi / harmony), or share of current chi when currency = 'share'. */
    baseCost: number;
    /** Cost also scales with production: max(baseCost, cps * cpsSeconds). */
    cpsSeconds: number;
    cooldown: number;
    nightOnly?: boolean;
    unlocked: (state: GameState) => boolean;
}

export const RITUALS: RitualDef[] = [
    {
        id: 'meditation',
        currency: 'chi',
        baseCost: 30,
        cpsSeconds: 8,
        cooldown: 25,
        unlocked: (s) => s.plants.lotus >= 3 || s.plants.fern >= 1,
    },
    {
        id: 'grounding',
        currency: 'chi',
        baseCost: 30,
        cpsSeconds: 8,
        cooldown: 25,
        unlocked: (s) => s.plants.lotus >= 3 || s.plants.fern >= 1,
    },
    {
        id: 'drums',
        currency: 'chi',
        baseCost: 200,
        cpsSeconds: 20,
        cooldown: 180,
        unlocked: (s) => s.stats.runChi >= 2_000,
    },
    {
        id: 'offering',
        currency: 'share',
        baseCost: 0.25,
        cpsSeconds: 0,
        cooldown: 300,
        unlocked: (s) => s.stats.runChi >= 5_000,
    },
    {
        id: 'rainDance',
        currency: 'chi',
        baseCost: 1_000,
        cpsSeconds: 30,
        cooldown: 420,
        unlocked: (s) => s.stats.runChi >= 20_000,
    },
    {
        id: 'vigil',
        currency: 'chi',
        baseCost: 5_000,
        cpsSeconds: 40,
        cooldown: 600,
        nightOnly: true,
        unlocked: (s) => s.stats.runHarmony >= 5,
    },
    {
        id: 'spiritCall',
        currency: 'harmony',
        baseCost: 20,
        cpsSeconds: 0,
        cooldown: 900,
        unlocked: (s) => s.stats.eventsResolved >= 1,
    },
];

export const RITUAL_BY_ID = Object.fromEntries(RITUALS.map((r) => [r.id, r])) as Record<RitualId, RitualDef>;

export const RITUAL_BALANCE_SHIFT = 15;
export const RAIN_DANCE_DURATION = 150;
/** Offering moves balance this share of the way towards 50. */
export const OFFERING_CENTERING = 0.6;

/** Harmony returned by an offering of `chi`: grows with the order of magnitude given. */
export const offeringHarmony = (chi: number): number => {
    const l = Math.log10(1 + Math.max(0, chi));
    return 1.5 * l * l;
};
