import type { Essence, PlantId } from '../types';

/** Declarative effects shared by upgrades and ancestral perks. */
export type Modifier =
    | { kind: 'plantMult'; plant: PlantId; value: number }
    | { kind: 'essenceMult'; essence: Essence; value: number }
    | { kind: 'globalMult'; value: number }
    | { kind: 'clickShare'; value: number }
    | { kind: 'clickMult'; value: number }
    | { kind: 'harmonyMult'; value: number }
    | { kind: 'harmonyWidth'; value: number }
    | { kind: 'driftMult'; value: number }
    | { kind: 'cooldownMult'; value: number }
    | { kind: 'offlineCap'; value: number }
    | { kind: 'offlineEff'; value: number }
    | { kind: 'dayNightMult'; value: number }
    | { kind: 'weatherMult'; value: number }
    | { kind: 'costMult'; value: number }
    | { kind: 'eventRate'; value: number }
    | { kind: 'startChi'; value: number }
    | { kind: 'keepZones' };
