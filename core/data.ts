// core/data.ts

import { Plant } from '../types';

export const initialPlants: Plant[] = [
    { id: 'sapling', name: 'Mystic Sapling', description: 'A young tree humming with nascent energy.', cost: 10, baseChi: 0.5 },
];

// The following are left as empty arrays to represent a reverted, basic state.
export const initialUpgrades: any[] = [];
export const initialRituals: any[] = [];
export const initialZones: any[] = [];
export const initialSpirits: any[] = [];
export const initialOfferings: any[] = [];
export const initialEvents: any[] = [];
