// types.ts

export type Plant = {
    id: string;
    name: string;
    description: string;
    cost: number;
    baseChi: number;
};

export type OwnedPlant = {
    id: string;
    level: number;
    baseChi: number;
};

// FIX: Add missing AwarenessLevel type to resolve errors in core/environmentalSystem.ts and render/pixi/particles.ts.
export type AwarenessLevel = 'physical' | 'ethereal' | 'astral';

// FIX: Add missing Weather type to resolve errors in render/pixi/particles.ts and core/events.ts.
export type Weather = string;

// FIX: Add missing GameEvent and GameEventChoice types to resolve errors in core/events.ts and components/EventModal.tsx.
export type GameEventChoice = {
    id: string;
    text: string;
};

export type GameEvent = {
    id: string;
    title: string;
    description: string;
    cooldown: number;
    weight: number;
    conditions: {
        requiredZoneId?: string;
        requiredWeather?: Weather;
        requiredMoonPhase?: string;
        minBalance?: number;
        maxBalance?: number;
    };
    choices: GameEventChoice[];
};

export type Settings = {
    volume: number;
    sfx: boolean;
    lowSpecMode: boolean;
};

export interface GameState {
    chi: number;
    chiPerSecond: number;
    plants: Record<string, OwnedPlant>;
    lastUpdate: number;

    // FIX: Add numerous missing properties to GameState to satisfy type usage across various components and fix compilation errors.
    harmony: number;
    harmonyPerSecond: number;
    balance: number;
    awareness: AwarenessLevel;
    unlockedZones: string[];
    currentZoneId: string;
    weather: Weather;
    moonPhase: string;
    eventHistory: Record<string, number>;
    logs: string[];
    settings: Settings;
    ownedUpgrades: Record<string, number>;
    ritualCooldowns: Record<string, number>;
    activeRituals: {id: string}[];
    spiritRelationships: Record<string, number>;
    currentEvent: GameEvent | null;

    // Actions
    tick: () => void;
    buyPlant: (plant: Plant) => void;
    addChi: (amount: number) => void;

    // FIX: Add missing actions to GameState interface.
    importState: (newState: Partial<GameState>) => void;
    addLog: (message: string) => void;
    levelUpPlant: (plantId: string, cost: number) => void;
    buyUpgrade: (upgrade: any) => void;
    startRitual: (ritual: any) => void;
    changeZone: (zoneId: string) => void;
    resolveEvent: (choice: GameEventChoice) => void;
    makeOffering: (spiritId: string, offering: any, affinityBonus: number) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    resetGame: () => void;
}