// core/data.ts
import { GameState, Plant, Ritual, Zone, Achievement, Upgrade } from '../types';

export const gameVersion = "0.1.0";

export const initialPlants: Record<string, Plant> = {
    p1: { id: 'p1', name: 'Stone Lotus', description: 'A sturdy, foundational plant.', level: 0, costBase: 10, costScaling: 1.15, cpsBase: 0.1, type: 'physical' },
    p2: { id: 'p2', name: 'Sunpetal', description: 'Glows with a gentle, warm light.', level: 0, costBase: 100, costScaling: 1.2, cpsBase: 1, type: 'physical' },
    p3: { id: 'p3', name: 'Moonshadow Fern', description: 'Thrives in stillness and quiet.', level: 0, costBase: 1200, costScaling: 1.25, cpsBase: 8, type: 'ethereal' },
    p4: { id: 'p4', name: 'Dreamwood Sapling', description: 'Its leaves whisper forgotten memories.', level: 0, costBase: 15000, costScaling: 1.3, cpsBase: 50, type: 'ethereal' },
};

export const initialRituals: Record<string, Ritual> = {
    r1: {
        id: 'r1', name: 'Meditation', description: 'Focus your mind, shifting balance towards the ethereal.', cost: 50,
        isUnlocked: (state) => state.plants.p1.level >= 5,
        effect: (state) => ({ balance: Math.min(100, state.balance + 5), log: [...state.log, "You meditate, feeling more attuned to the ethereal."] }),
    },
    r2: {
        id: 'r2', name: 'Grounding', description: 'Connect with the earth, shifting balance towards the physical.', cost: 50,
        isUnlocked: (state) => state.plants.p1.level >= 5,
        effect: (state) => ({ balance: Math.max(0, state.balance - 5), log: [...state.log, "You ground yourself, feeling the strength of the earth."] }),
    },
};

export const initialZones: Record<string, Zone> = {
    z1: { id: 'z1', name: 'Serene Grove', description: 'A balanced, peaceful starting area.', unlockCondition: () => true },
    z2: { id: 'z2', name: 'Sun-dappled Meadow', description: 'Favors physical growth.', unlockCondition: (state) => state.totalChi >= 1000 },
};

export const initialUpgrades: Record<string, Upgrade> = {}; // Empty for now

export const initialAchievements: Record<string, Achievement> = {
    a1: { id: 'a1', name: 'First Bud', description: 'Purchase your first Stone Lotus.', unlocked: false, check: (state) => state.plants.p1.level > 0 },
    a2: { id: 'a2', name: 'Thousand Petals', description: 'Accumulate 1,000 total Chi.', unlocked: false, check: (state) => state.totalChi >= 1000 },
    a3: { id: 'a3', name: 'Spiritual Attunement', description: 'Perform a ritual for the first time.', unlocked: false, check: (state) => state.log.some(l => l.includes('meditate') || l.includes('ground')) },
};

export const initialPrestige = {
    points: 0,
    pendingPoints: 0,
};


export const getInitialState = (): GameState => ({
    chi: 10,
    balance: 50,
    plants: JSON.parse(JSON.stringify(initialPlants)),
    rituals: JSON.parse(JSON.stringify(initialRituals)),
    zones: JSON.parse(JSON.stringify(initialZones)),
    upgrades: JSON.parse(JSON.stringify(initialUpgrades)),
    achievements: JSON.parse(JSON.stringify(initialAchievements)),
    prestige: JSON.parse(JSON.stringify(initialPrestige)),
    currentZoneId: 'z1',
    log: ["Your garden awaits."],
    lastUpdate: Date.now(),
    currentEvent: null,
    totalChi: 10,
    playTime: 0,
});
