// types.ts

export interface Plant {
    id: string;
    name: string;
    description: string;
    level: number;
    costBase: number;
    costScaling: number;
    cpsBase: number; // Chi Per Second
    type: 'physical' | 'ethereal';
}

export interface Ritual {
    id: string;
    name: string;
    description: string;
    cost: number;
    effect: (state: GameState) => Partial<GameState>;
    isUnlocked: (state: GameState) => boolean;
}

export interface Zone {
    id: string;
    name: string;
    description: string;
    unlockCondition: (state: GameState) => boolean;
}

export interface GameEventChoice {
    text: string;
    effect: (state: GameState) => Partial<GameState>;
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    trigger: (state: GameState) => boolean;
    choices: GameEventChoice[];
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    check: (state: GameState) => boolean;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    unlocked: boolean;
    effect: (state: GameState) => Partial<GameState>;
    isUnlocked: (state: GameState) => boolean;
}

export interface PrestigeState {
    points: number;
    pendingPoints: number;
}

export interface OfflineReport {
    secondsOffline: number;
    chiGained: number;
}

export interface GameState {
    chi: number;
    balance: number; // 0 (physical) to 100 (ethereal)
    plants: Record<string, Plant>;
    rituals: Record<string, Ritual>;
    zones: Record<string, Zone>;
    upgrades: Record<string, Upgrade>;
    achievements: Record<string, Achievement>;
    prestige: PrestigeState;
    currentZoneId: string;
    log: string[];
    lastUpdate: number;
    currentEvent: GameEvent | null;
    totalChi: number;
    playTime: number; // in seconds
    offlineReport: OfflineReport | null;
}

// Making actions a separate interface for the store
export interface GameActions {
    tick: (deltaTime: number) => void;
    levelUpPlant: (plantId: string) => void;
    performRitual: (ritualId: string) => void;
    changeZone: (zoneId: string) => void;
    resolveEvent: (choiceIndex: number) => void;
    importState: (newState: GameState) => void;
    reset: () => void;
    prestige: () => void;
    clearOfflineReport: () => void;
    // Dev actions
    addChi: (amount: number) => void;
}

// The complete store shape
export type GameStore = GameState & {
    actions: GameActions;
};
