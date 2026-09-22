// Pure data types of the simulation. Nothing in here may contain functions:
// the whole GameState is serialised to localStorage as-is.

export type Essence = 'physical' | 'ethereal' | 'neutral';
export type WeatherKind = 'clear' | 'rain' | 'mist' | 'aurora';
export type BuffId = 'drums' | 'vigil' | 'serenity' | 'insight';

export type PlantId =
    | 'lotus'
    | 'fern'
    | 'sunpetal'
    | 'willow'
    | 'oak'
    | 'dreamwood'
    | 'emberroot'
    | 'starbloom'
    | 'worldtree';

export type ZoneId = 'grove' | 'desert' | 'rainforest' | 'mountains' | 'aurora' | 'dreamworld';

export interface ActiveBuff {
    id: BuffId;
    /** worldTime (seconds) at which the buff ends */
    until: number;
}

export interface WeatherState {
    kind: WeatherKind;
    /** worldTime at which the next weather roll happens */
    until: number;
}

export interface LogEntry {
    /** wall clock timestamp (ms) */
    at: number;
    /** i18n key below `log.` */
    key: string;
    params?: Record<string, string | number>;
}

export interface GameStats {
    /** Chi earned in the current cycle */
    runChi: number;
    /** Chi earned across all cycles */
    lifetimeChi: number;
    /** Harmony earned in the current cycle */
    runHarmony: number;
    clicks: number;
    clickChi: number;
    rituals: number;
    eventsResolved: number;
    prestiges: number;
    /** seconds played (online + offline simulated) */
    playTime: number;
    /** current consecutive seconds with harmony >= 0.9 */
    harmonyStreak: number;
    bestHarmonyStreak: number;
    maxCps: number;
    auroras: number;
    offerings: number;
}

export interface PrestigeState {
    /** Ancestral wisdom earned over all cycles (drives the passive bonus). */
    wisdom: number;
    /** Wisdom spent on ancestral perks. */
    spent: number;
    perks: string[];
}

export interface GameState {
    schema: number;
    chi: number;
    harmony: number;
    /** 0 = fully physical, 100 = fully ethereal, 50 = perfect equilibrium */
    balance: number;
    plants: Record<PlantId, number>;
    upgrades: string[];
    zones: ZoneId[];
    zone: ZoneId;
    buffs: ActiveBuff[];
    /** ritual id -> worldTime when it becomes ready again */
    cooldowns: Record<string, number>;
    weather: WeatherState;
    /** Simulation clock in seconds. Drives day/night, buffs, weather. */
    worldTime: number;
    /** mulberry32 state */
    rng: number;
    nextEventAt: number;
    activeEvent: string | null;
    achievements: string[];
    stats: GameStats;
    prestige: PrestigeState;
    log: LogEntry[];
    tutorial: number;
    /** wall clock (ms) of the last simulated moment, used for offline progress */
    lastSeen: number;
}

export interface OfflineReport {
    seconds: number;
    chi: number;
    harmony: number;
    efficiency: number;
}

/** Side effects the pure core reports so the UI / renderer / audio can react. */
export type GameSignal =
    | { type: 'achievement'; id: string }
    | { type: 'weather'; kind: WeatherKind }
    | { type: 'event'; id: string }
    | { type: 'buffEnded'; id: BuffId }
    | { type: 'plantRevealed'; id: PlantId };
