// core/environmentalSystem.ts
import { GameState } from '../types';

/**
 * Calculates production modifiers based on the current zone.
 * @param state The current game state.
 * @returns An object with modifiers for each plant type.
 */
export const getZoneModifier = (state: GameState): { physical: number, ethereal: number } => {
    const currentZone = state.zones[state.currentZoneId];

    if (!currentZone) {
        return { physical: 1, ethereal: 1 };
    }

    switch (currentZone.id) {
        case 'z1': // Serene Grove
            return { physical: 1, ethereal: 1 };
        case 'z2': // Sun-dappled Meadow
            return { physical: 1.25, ethereal: 0.75 };
        default:
            return { physical: 1, ethereal: 1 };
    }
};
