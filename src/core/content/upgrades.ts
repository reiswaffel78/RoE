import type { GameState, PlantId } from '../types';
import type { Modifier } from './modifiers';
import { PLANTS } from './plants';

export type UpgradeGroup = 'plant' | 'click' | 'harmony' | 'world';

export interface UpgradeDef {
    id: string;
    group: UpgradeGroup;
    currency: 'chi' | 'harmony';
    cost: number;
    /** Upgrade becomes visible once this is true. */
    visible: (state: GameState) => boolean;
    effects: Modifier[];
    /** Set for generated plant tier upgrades. */
    plant?: PlantId;
    tier?: number;
}

/** Plant tier upgrades: required owned level and cost multiplier vs. base cost. */
export const PLANT_TIERS = [
    { level: 10, costMult: 25 },
    { level: 25, costMult: 500 },
    { level: 50, costMult: 25_000 },
    { level: 100, costMult: 5_000_000 },
];

const plantUpgrades: UpgradeDef[] = PLANTS.flatMap((plant) =>
    PLANT_TIERS.map((tier, index) => ({
        id: `${plant.id}-${index + 1}`,
        group: 'plant' as const,
        currency: 'chi' as const,
        cost: plant.baseCost * tier.costMult,
        visible: (s: GameState) => s.plants[plant.id] >= tier.level,
        effects: [{ kind: 'plantMult', plant: plant.id, value: 2 } as Modifier],
        plant: plant.id,
        tier: index + 1,
    })),
);

const specialUpgrades: UpgradeDef[] = [
    {
        id: 'gentleHands',
        group: 'click',
        currency: 'chi',
        cost: 150,
        visible: (s) => s.stats.clicks >= 15,
        effects: [{ kind: 'clickShare', value: 0.02 }],
    },
    {
        id: 'spiritTouch',
        group: 'click',
        currency: 'chi',
        cost: 50_000,
        visible: (s) => s.stats.clicks >= 150,
        effects: [{ kind: 'clickShare', value: 0.04 }, { kind: 'clickMult', value: 2 }],
    },
    {
        id: 'heartbeat',
        group: 'click',
        currency: 'chi',
        cost: 50_000_000,
        visible: (s) => s.stats.clicks >= 800,
        effects: [{ kind: 'clickShare', value: 0.06 }],
    },
    {
        id: 'equanimity',
        group: 'harmony',
        currency: 'harmony',
        cost: 20,
        visible: (s) => s.stats.runHarmony >= 5,
        effects: [{ kind: 'harmonyWidth', value: 6 }],
    },
    {
        id: 'deepListening',
        group: 'harmony',
        currency: 'chi',
        cost: 250_000,
        visible: (s) => s.stats.runHarmony >= 10,
        effects: [{ kind: 'harmonyMult', value: 2 }],
    },
    {
        id: 'stillWater',
        group: 'harmony',
        currency: 'harmony',
        cost: 80,
        visible: (s) => s.stats.runHarmony >= 40,
        effects: [{ kind: 'driftMult', value: 0.5 }],
    },
    {
        id: 'ritualMastery',
        group: 'harmony',
        currency: 'harmony',
        cost: 150,
        visible: (s) => s.stats.rituals >= 10,
        effects: [{ kind: 'cooldownMult', value: 0.7 }],
    },
    {
        id: 'dreamMemory',
        group: 'harmony',
        currency: 'harmony',
        cost: 250,
        visible: (s) => s.stats.runHarmony >= 120,
        effects: [{ kind: 'offlineEff', value: 0.5 }],
    },
    {
        id: 'starlitCanopy',
        group: 'harmony',
        currency: 'harmony',
        cost: 600,
        visible: (s) => s.stats.runHarmony >= 300,
        effects: [{ kind: 'globalMult', value: 1.5 }],
    },
    {
        id: 'sunAndMoon',
        group: 'world',
        currency: 'chi',
        cost: 2_000_000,
        visible: (s) => s.zones.length >= 2,
        effects: [{ kind: 'dayNightMult', value: 2.5 }],
    },
    {
        id: 'longSleep',
        group: 'world',
        currency: 'chi',
        cost: 5_000_000,
        visible: (s) => s.stats.runChi >= 1_000_000,
        effects: [{ kind: 'offlineCap', value: 16 * 3600 }],
    },
    {
        id: 'earthMastery',
        group: 'world',
        currency: 'chi',
        cost: 10_000_000,
        visible: (s) => s.plants.oak >= 10,
        effects: [{ kind: 'essenceMult', essence: 'physical', value: 1.5 }],
    },
    {
        id: 'dreamMastery',
        group: 'world',
        currency: 'chi',
        cost: 10_000_000,
        visible: (s) => s.plants.dreamwood >= 10,
        effects: [{ kind: 'essenceMult', essence: 'ethereal', value: 1.5 }],
    },
    {
        id: 'weatherkeeper',
        group: 'world',
        currency: 'chi',
        cost: 30_000_000,
        visible: (s) => s.zones.length >= 3,
        effects: [{ kind: 'weatherMult', value: 2 }],
    },
    {
        id: 'rootedHeart',
        group: 'world',
        currency: 'chi',
        cost: 5_000_000_000,
        visible: (s) => s.plants.worldtree >= 1,
        effects: [{ kind: 'globalMult', value: 2 }],
    },
];

export const UPGRADES: UpgradeDef[] = [...specialUpgrades, ...plantUpgrades];

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
