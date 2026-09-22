// Tiny typed event bus between the game store and presentation layers
// (Pixi renderer, audio engine, toasts). Keeps the core free of side effects.

import type { GameSignal, PlantId, WeatherKind, ZoneId } from '../core';
import type { FailReason, RitualId } from '../core';

export type FxEvent =
    | { type: 'gather'; x: number; y: number; amount: number }
    | { type: 'plantBought'; id: PlantId; count: number }
    | { type: 'upgradeBought'; id: string }
    | { type: 'perkBought'; id: string }
    | { type: 'zoneUnlocked'; id: ZoneId }
    | { type: 'travel'; id: ZoneId }
    | { type: 'ritual'; id: RitualId; amount?: number }
    | { type: 'eventResolved'; id: string; choice: string }
    | { type: 'denied'; reason: FailReason }
    | { type: 'newCycle'; wisdom: number }
    | { type: 'weatherPreview'; kind: WeatherKind }
    | { type: 'signal'; signal: GameSignal };

type Listener = (event: FxEvent) => void;

const listeners = new Set<Listener>();

export const fx = {
    emit(event: FxEvent) {
        for (const listener of listeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('fx listener failed', error);
            }
        }
    },
    on(listener: Listener): () => void {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
