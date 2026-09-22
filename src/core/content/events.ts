import type { BuffId, GameState } from '../types';

/** Declarative outcome of an event choice; applied by core/actions.ts. */
export interface EventOutcome {
    /** Chi gained = cps * seconds (min `chiMin`). */
    chiSeconds?: number;
    chiMin?: number;
    /** Share of current chi given away (0..1). */
    chiShare?: number;
    /** Harmony gained = flat + perLog * log10(1 + cps). */
    harmonyFlat?: number;
    harmonyPerLog?: number;
    /** Absolute balance shift (positive = ethereal). */
    balanceShift?: number;
    /** Move balance this share of the way towards 50. */
    balanceCenter?: number;
    buff?: BuffId;
    weather?: 'rain';
    weatherSeconds?: number;
}

export interface EventChoiceDef {
    id: string;
    outcome: EventOutcome;
}

export interface EventDef {
    id: string;
    icon: 'sprite' | 'deer' | 'traveler' | 'star' | 'voice' | 'moon' | 'rain';
    weight: number;
    condition?: (state: GameState, ctx: { night: boolean }) => boolean;
    choices: EventChoiceDef[];
}

export const EVENTS: EventDef[] = [
    {
        id: 'sprite',
        icon: 'sprite',
        weight: 3,
        choices: [
            { id: 'gift', outcome: { chiSeconds: 60, chiMin: 50 } },
            { id: 'wisdom', outcome: { harmonyFlat: 3, harmonyPerLog: 2 } },
        ],
    },
    {
        id: 'deer',
        icon: 'deer',
        weight: 2,
        choices: [
            { id: 'follow', outcome: { balanceCenter: 1, harmonyFlat: 2, harmonyPerLog: 1 } },
            { id: 'release', outcome: { buff: 'serenity' } },
        ],
    },
    {
        id: 'traveler',
        icon: 'traveler',
        weight: 2,
        condition: (s) => s.chi > 100,
        choices: [
            { id: 'share', outcome: { chiShare: 0.15, harmonyFlat: 4, harmonyPerLog: 3 } },
            { id: 'decline', outcome: {} },
        ],
    },
    {
        id: 'fallenStar',
        icon: 'star',
        weight: 2,
        condition: (s) => s.stats.runChi > 5_000,
        choices: [
            { id: 'keep', outcome: { chiSeconds: 150, balanceShift: -12 } },
            { id: 'return', outcome: { harmonyFlat: 5, harmonyPerLog: 2, balanceShift: 12 } },
        ],
    },
    {
        id: 'voice',
        icon: 'voice',
        weight: 2,
        choices: [
            { id: 'listen', outcome: { buff: 'insight' } },
            { id: 'ask', outcome: { chiSeconds: 90, chiMin: 100 } },
        ],
    },
    {
        id: 'moonflowers',
        icon: 'moon',
        weight: 3,
        condition: (_s, { night }) => night,
        choices: [
            { id: 'gather', outcome: { chiSeconds: 120, chiMin: 100, balanceShift: 8 } },
            { id: 'honor', outcome: { harmonyFlat: 3, harmonyPerLog: 2, buff: 'vigil' } },
        ],
    },
    {
        id: 'rainSpirit',
        icon: 'rain',
        weight: 4,
        condition: (s) => s.weather.kind === 'rain',
        choices: [
            { id: 'dance', outcome: { weather: 'rain', weatherSeconds: 120, buff: 'drums' } },
            { id: 'thank', outcome: { harmonyFlat: 4, harmonyPerLog: 1, balanceShift: -6 } },
        ],
    },
];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
