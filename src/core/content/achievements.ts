import type { GameState } from '../types';
import { PLANT_IDS } from './plants';

export interface AchievementContext {
    state: GameState;
    cps: number;
}

export interface AchievementDef {
    id: string;
    icon: 'leaf' | 'chi' | 'spark' | 'hand' | 'balance' | 'ritual' | 'map' | 'aurora' | 'eye' | 'cycle' | 'heart';
    check: (ctx: AchievementContext) => boolean;
    /** Optional progress 0..1 for the journal. */
    progress?: (ctx: AchievementContext) => number;
}

const totalLevels = (s: GameState) => PLANT_IDS.reduce((sum, id) => sum + s.plants[id], 0);
const ratio = (value: number, target: number) => Math.min(1, value / target);

const chiMilestone = (id: string, target: number): AchievementDef => ({
    id,
    icon: 'chi',
    check: ({ state }) => state.stats.lifetimeChi >= target,
    progress: ({ state }) => ratio(state.stats.lifetimeChi, target),
});

const cpsMilestone = (id: string, target: number): AchievementDef => ({
    id,
    icon: 'spark',
    check: ({ cps }) => cps >= target,
    progress: ({ state }) => ratio(state.stats.maxCps, target),
});

export const ACHIEVEMENTS: AchievementDef[] = [
    { id: 'firstSprout', icon: 'leaf', check: ({ state }) => totalLevels(state) >= 1 },
    {
        id: 'gardener',
        icon: 'leaf',
        check: ({ state }) => totalLevels(state) >= 50,
        progress: ({ state }) => ratio(totalLevels(state), 50),
    },
    {
        id: 'forestKeeper',
        icon: 'leaf',
        check: ({ state }) => totalLevels(state) >= 250,
        progress: ({ state }) => ratio(totalLevels(state), 250),
    },
    {
        id: 'diversity',
        icon: 'leaf',
        check: ({ state }) => PLANT_IDS.filter((id) => id !== 'worldtree').every((id) => state.plants[id] > 0),
        progress: ({ state }) => ratio(PLANT_IDS.filter((id) => id !== 'worldtree' && state.plants[id] > 0).length, 8),
    },
    { id: 'worldTree', icon: 'heart', check: ({ state }) => state.plants.worldtree >= 1 },
    chiMilestone('chi1k', 1e3),
    chiMilestone('chi100k', 1e5),
    chiMilestone('chi10m', 1e7),
    chiMilestone('chi1b', 1e9),
    chiMilestone('chi1t', 1e12),
    cpsMilestone('cps10', 10),
    cpsMilestone('cps1k', 1e3),
    cpsMilestone('cps100k', 1e5),
    cpsMilestone('cps10m', 1e7),
    {
        id: 'touch100',
        icon: 'hand',
        check: ({ state }) => state.stats.clicks >= 100,
        progress: ({ state }) => ratio(state.stats.clicks, 100),
    },
    {
        id: 'touch1000',
        icon: 'hand',
        check: ({ state }) => state.stats.clicks >= 1000,
        progress: ({ state }) => ratio(state.stats.clicks, 1000),
    },
    {
        id: 'stillness',
        icon: 'balance',
        check: ({ state }) => state.stats.bestHarmonyStreak >= 60,
        progress: ({ state }) => ratio(state.stats.bestHarmonyStreak, 60),
    },
    {
        id: 'equilibrium',
        icon: 'balance',
        check: ({ state }) => state.stats.bestHarmonyStreak >= 900,
        progress: ({ state }) => ratio(state.stats.bestHarmonyStreak, 900),
    },
    {
        id: 'harmony100',
        icon: 'balance',
        check: ({ state }) => state.stats.runHarmony >= 100,
        progress: ({ state }) => ratio(state.stats.runHarmony, 100),
    },
    { id: 'firstRitual', icon: 'ritual', check: ({ state }) => state.stats.rituals >= 1 },
    {
        id: 'ritualist',
        icon: 'ritual',
        check: ({ state }) => state.stats.rituals >= 50,
        progress: ({ state }) => ratio(state.stats.rituals, 50),
    },
    { id: 'giver', icon: 'heart', check: ({ state }) => state.stats.offerings >= 1 },
    { id: 'traveler', icon: 'map', check: ({ state }) => state.zones.length >= 2 },
    {
        id: 'wanderer',
        icon: 'map',
        check: ({ state }) => state.zones.length >= 6,
        progress: ({ state }) => ratio(state.zones.length, 6),
    },
    { id: 'aurora', icon: 'aurora', check: ({ state }) => state.stats.auroras >= 1 },
    { id: 'listener', icon: 'eye', check: ({ state }) => state.stats.eventsResolved >= 1 },
    {
        id: 'confidant',
        icon: 'eye',
        check: ({ state }) => state.stats.eventsResolved >= 10,
        progress: ({ state }) => ratio(state.stats.eventsResolved, 10),
    },
    { id: 'newCycle', icon: 'cycle', check: ({ state }) => state.stats.prestiges >= 1 },
    {
        id: 'wheel',
        icon: 'cycle',
        check: ({ state }) => state.stats.prestiges >= 5,
        progress: ({ state }) => ratio(state.stats.prestiges, 5),
    },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
    ACHIEVEMENTS.map((a) => [a.id, a]),
);
