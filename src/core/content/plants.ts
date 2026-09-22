import type { Essence, PlantId } from '../types';

export interface PlantDef {
    id: PlantId;
    essence: Essence;
    baseCost: number;
    growth: number;
    baseCps: number;
    /** Visual archetype used by the renderer. */
    visual: PlantId;
}

// Costs grow ~×11 per tier, output ~×6 per tier: every tier pays back more
// slowly than the last, which is the classic incremental pacing curve.
// Essences alternate so a healthy garden needs both kinds.
export const PLANTS: PlantDef[] = [
    { id: 'lotus', essence: 'physical', baseCost: 15, growth: 1.15, baseCps: 0.3, visual: 'lotus' },
    { id: 'fern', essence: 'ethereal', baseCost: 110, growth: 1.15, baseCps: 1.6, visual: 'fern' },
    { id: 'sunpetal', essence: 'physical', baseCost: 1_200, growth: 1.15, baseCps: 9, visual: 'sunpetal' },
    { id: 'willow', essence: 'ethereal', baseCost: 13_000, growth: 1.15, baseCps: 50, visual: 'willow' },
    { id: 'oak', essence: 'physical', baseCost: 140_000, growth: 1.15, baseCps: 280, visual: 'oak' },
    { id: 'dreamwood', essence: 'ethereal', baseCost: 1_600_000, growth: 1.15, baseCps: 1_600, visual: 'dreamwood' },
    { id: 'emberroot', essence: 'physical', baseCost: 22_000_000, growth: 1.15, baseCps: 10_000, visual: 'emberroot' },
    { id: 'starbloom', essence: 'ethereal', baseCost: 330_000_000, growth: 1.15, baseCps: 65_000, visual: 'starbloom' },
    { id: 'worldtree', essence: 'neutral', baseCost: 5_000_000_000, growth: 1.15, baseCps: 420_000, visual: 'worldtree' },
];

export const PLANT_IDS = PLANTS.map((p) => p.id);

export const PLANT_BY_ID: Record<PlantId, PlantDef> = Object.fromEntries(
    PLANTS.map((p) => [p.id, p]),
) as Record<PlantId, PlantDef>;
