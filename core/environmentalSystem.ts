// core/environmentalSystem.ts

import { GameState, AwarenessLevel } from '../types';

/**
 * The result of checking for an awareness level change.
 * Contains the new awareness level and an optional log message if a change occurred.
 */
export type AwarenessCheckResult = {
    newAwareness: AwarenessLevel;
    logMessage?: string;
};

/**
 * A PURE function that checks if the conditions are met to advance to a new awareness level.
 * It does not modify state directly.
 * @param currentState A snapshot of the required parts of the game state.
 * @returns An AwarenessCheckResult object.
 */
export const checkAwarenessLevel = (
    currentState: Pick<GameState, 'awareness' | 'unlockedZones' | 'chiPerSecond'>
): AwarenessCheckResult => {
    // Rule to unlock Ethereal awareness
    if (currentState.awareness === 'physical' && currentState.unlockedZones.length > 1 && currentState.chiPerSecond > 1000) {
        return {
            newAwareness: 'ethereal',
            logMessage: "Your consciousness expands! You can now perceive the Ethereal plane."
        };
    }

    // Rule to unlock Astral awareness could be added here
    // if (currentState.awareness === 'ethereal' && ... ) {
    //     return { newAwareness: 'astral', logMessage: 'You have ascended to the Astral plane!' };
    // }

    // If no conditions are met, return the current awareness level with no log message.
    return { newAwareness: currentState.awareness };
};
