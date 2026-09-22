import type { Modifier } from './modifiers';

export interface PerkDef {
    id: string;
    cost: number;
    effects: Modifier[];
}

/** Permanent perks bought with ancestral wisdom; survive every new cycle. */
export const PERKS: PerkDef[] = [
    { id: 'seedMemory', cost: 1, effects: [{ kind: 'startChi', value: 500 }] },
    { id: 'spiritKin', cost: 1, effects: [{ kind: 'clickMult', value: 3 }] },
    { id: 'ancestralRhythm', cost: 2, effects: [{ kind: 'cooldownMult', value: 0.8 }] },
    { id: 'dreamer', cost: 2, effects: [{ kind: 'offlineCap', value: 12 * 3600 }, { kind: 'offlineEff', value: 0.25 }] },
    { id: 'voiceOfForest', cost: 2, effects: [{ kind: 'eventRate', value: 2 }] },
    { id: 'keeperOfBalance', cost: 3, effects: [{ kind: 'harmonyWidth', value: 4 }] },
    { id: 'oldRoots', cost: 4, effects: [{ kind: 'costMult', value: 0.9 }] },
    { id: 'eternalGrove', cost: 5, effects: [{ kind: 'keepZones' }] },
    { id: 'ancestralBloom', cost: 8, effects: [{ kind: 'globalMult', value: 2 }] },
];

export const PERK_BY_ID: Record<string, PerkDef> = Object.fromEntries(PERKS.map((p) => [p.id, p]));
