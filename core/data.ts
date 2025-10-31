// core/data.ts
import { Achievement, GameState, OfflineReport, Plant, PrestigeState, Ritual, Upgrade, Zone } from '../types';

export const gameVersion = '0.1.0';

export const initialPlants: Record<string, Plant> = {
    p1: {
        id: 'p1',
        name: 'Stone Lotus',
        description: 'A sturdy, foundational plant.',
        level: 0,
        costBase: 10,
        costScaling: 1.15,
        cpsBase: 0.1,
        type: 'physical',
    },
    p2: {
        id: 'p2',
        name: 'Sunpetal',
        description: 'Glows with a gentle, warm light.',
        level: 0,
        costBase: 100,
        costScaling: 1.2,
        cpsBase: 1,
        type: 'physical',
    },
    p3: {
        id: 'p3',
        name: 'Moonshadow Fern',
        description: 'Thrives in stillness and quiet.',
        level: 0,
        costBase: 1200,
        costScaling: 1.25,
        cpsBase: 8,
        type: 'ethereal',
    },
    p4: {
        id: 'p4',
        name: 'Dreamwood Sapling',
        description: 'Its leaves whisper forgotten memories.',
        level: 0,
        costBase: 15000,
        costScaling: 1.3,
        cpsBase: 50,
        type: 'ethereal',
    },
};

export const initialRituals: Record<string, Ritual> = {
    r1: {
                id: 'r1',
        name: 'Meditation',
        description: 'Focus your mind, shifting balance towards the ethereal.',
        cost: 50,
        isUnlocked: (state) => state.plants.p1.level >= 5,
        effect: (state) => ({
            balance: Math.min(100, state.balance + 5),
            log: [...state.log, 'You meditate, feeling more attuned to the ethereal.'],
        }),    },
    r2: {
         id: 'r2',
        name: 'Grounding',
        description: 'Connect with the earth, shifting balance towards the physical.',
        cost: 50,
        isUnlocked: (state) => state.plants.p1.level >= 5,
        effect: (state) => ({
            balance: Math.max(0, state.balance - 5),
            log: [...state.log, 'You ground yourself, feeling the strength of the earth.'],
        }),    },
};

export const initialZones: Record<string, Zone> = {
    z1: {
        id: 'z1',
        name: 'Serene Grove',
        description: 'A balanced, peaceful starting area.',
        unlockCondition: () => true,
    },
    z2: {
        id: 'z2',
        name: 'Sun-dappled Meadow',
        description: 'Favors physical growth.',
        unlockCondition: (state) => state.totalChi >= 1000,
    },
};

export const initialUpgrades: Record<string, Upgrade> = {}; // Empty for now

export const initialAchievements: Record<string, Achievement> = {
    a1: {
        id: 'a1',
        name: 'First Bud',
        description: 'Purchase your first Stone Lotus.',
        unlocked: false,
        check: (state) => state.plants.p1.level > 0,
    },
    a2: {
        id: 'a2',
        name: 'Thousand Petals',
        description: 'Accumulate 1,000 total Chi.',
        unlocked: false,
        check: (state) => state.totalChi >= 1000,
    },
    a3: {
        id: 'a3',
        name: 'Spiritual Attunement',
        description: 'Perform a ritual for the first time.',
        unlocked: false,
        check: (state) => state.log.some((l) => l.includes('meditate') || l.includes('ground')),
    },
};

export const initialPrestige: PrestigeState = {
    points: 0,
    pendingPoints: 0,
};


const clampNumber = (value: number, min: number, max?: number) => {
    if (!Number.isFinite(value)) {
        return min;
    }
    const clamped = Math.max(min, value);
    return max === undefined ? clamped : Math.min(clamped, max);
};

const cloneRecord = <T extends { id: string }>(record: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(record).map(([id, value]) => [id, { ...value }])) as Record<string, T>;

const clonePlants = (override?: Record<string, Plant>): Record<string, Plant> => {
    const base = cloneRecord(initialPlants);
    if (!override) {
        return base;
    }

    for (const [id, plant] of Object.entries(base)) {
        const persisted = override[id];
        if (persisted) {
            const level = Math.max(0, Math.floor(Number(persisted.level ?? plant.level)));
            plant.level = Number.isFinite(level) ? level : plant.level;
        }
    }
    return base;
};

const cloneRituals = (): Record<string, Ritual> => cloneRecord(initialRituals);

const cloneZones = (): Record<string, Zone> => cloneRecord(initialZones);

const cloneUpgrades = (override?: Record<string, Upgrade>): Record<string, Upgrade> => {
    const base = cloneRecord(initialUpgrades);
    if (!override) {
        return base;
    }

    for (const [id, upgrade] of Object.entries(base)) {
        const persisted = override[id];
        if (persisted) {
            upgrade.unlocked = Boolean(persisted.unlocked);
        }
    }
    return base;
};

const cloneAchievements = (override?: Record<string, Achievement>): Record<string, Achievement> => {
    const base = cloneRecord(initialAchievements);
    if (!override) {
        return base;
    }

    for (const [id, achievement] of Object.entries(base)) {
        const persisted = override[id];
        if (persisted) {
            achievement.unlocked = Boolean(persisted.unlocked);
        }
    }
    return base;
};

const clonePrestige = (override?: PrestigeState): PrestigeState => ({
    points: clampNumber(override?.points ?? initialPrestige.points, 0),
    pendingPoints: clampNumber(override?.pendingPoints ?? initialPrestige.pendingPoints, 0),
});

const sanitizeLog = (log?: unknown[]): string[] => {
    if (!Array.isArray(log)) {
        return ['Your garden awaits.'];
    }
    const filtered = log.filter((entry): entry is string => typeof entry === 'string');
    return filtered.length > 0 ? filtered.slice(-200) : ['Your garden awaits.'];
};

const sanitizeOfflineReport = (report?: OfflineReport | null): OfflineReport | null => {
    if (!report) {
        return null;
    }
    const seconds = Number.isFinite(report.secondsOffline) ? Math.max(0, Math.floor(report.secondsOffline)) : 0;
    const chi = Number.isFinite(report.chiGained) ? Math.max(0, report.chiGained) : 0;
    if (seconds <= 0 || chi <= 0) {
        return null;
    }
    return { secondsOffline: seconds, chiGained: chi };
};

const sanitizeZoneId = (zoneId: string | undefined): string => (zoneId && initialZones[zoneId] ? zoneId : 'z1');

export const getInitialState = (): GameState => ({
    version: gameVersion,
    chi: 10,
    balance: 50,
    plants: clonePlants(),
    rituals: cloneRituals(),
    zones: cloneZones(),
    upgrades: cloneUpgrades(),
    achievements: cloneAchievements(),
    prestige: clonePrestige(),
    currentZoneId: 'z1',
    log: ['Your garden awaits.'],
    lastUpdate: Date.now(),
    currentEvent: null,
    totalChi: 10,
    playTime: 0,
    offlineReport: null,
});

export const normalizeState = (partial?: Partial<GameState>): GameState => {
    if (!partial) {
        return getInitialState();
    }

    const base = getInitialState();
    const version = typeof partial.version === 'string' && partial.version.trim() ? partial.version : gameVersion;
    const chi = clampNumber(Number(partial.chi ?? base.chi), 0);
    const totalChi = clampNumber(Number(partial.totalChi ?? base.totalChi), 0);
    const playTime = clampNumber(Number(partial.playTime ?? base.playTime), 0);
    const balance = clampNumber(Number(partial.balance ?? base.balance), 0, 100);
    const lastUpdate = Number(partial.lastUpdate);

    return {
        ...base,
        chi,
        totalChi,
        playTime,
        balance,
        plants: clonePlants(partial.plants),
        rituals: cloneRituals(),
        zones: cloneZones(),
        upgrades: cloneUpgrades(partial.upgrades),
        achievements: cloneAchievements(partial.achievements),
        prestige: clonePrestige(partial.prestige ?? undefined),
        currentZoneId: sanitizeZoneId(partial.currentZoneId),
        log: sanitizeLog(partial.log as unknown[] | undefined),
        lastUpdate: Number.isFinite(lastUpdate) && lastUpdate > 0 ? lastUpdate : Date.now(),
        currentEvent: null,
        offlineReport: sanitizeOfflineReport(partial.offlineReport ?? null),
        version,
    };
};