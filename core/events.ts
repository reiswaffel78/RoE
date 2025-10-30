// core/events.ts

import { GameState, GameEvent } from '../types';
import { initialEvents } from './data';

/**
 * Selects a valid event to trigger based on the current game state.
 * @param state The current game state.
 * @returns A randomly selected valid GameEvent or null if none are available.
 */
export const selectEvent = (state: GameState): GameEvent | null => {
    const now = Date.now();

    const validEvents = initialEvents.filter(event => {
        // 1. Check cooldown
        const lastTriggered = state.eventHistory[event.id];
        if (lastTriggered && (now - lastTriggered) < event.cooldown * 1000) {
            return false;
        }

        // 2. Check conditions
        const { conditions } = event;
        if (conditions.requiredZoneId && conditions.requiredZoneId !== state.currentZoneId) return false;
        if (conditions.requiredWeather && conditions.requiredWeather !== state.weather) return false;
        if (conditions.requiredMoonPhase && conditions.requiredMoonPhase !== state.moonPhase) return false;
        if (conditions.minBalance && state.balance < conditions.minBalance) return false;
        if (conditions.maxBalance && state.balance > conditions.maxBalance) return false;
        
        return true;
    });

    if (validEvents.length === 0) {
        return null;
    }

    // Weighted random selection
    const totalWeight = validEvents.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;

    for (const event of validEvents) {
        if (random < event.weight) {
            return event;
        }
        random -= event.weight;
    }

    return null;
};
