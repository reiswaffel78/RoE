// core/balanceSystem.ts
import { GameState } from '../types';

/**
 * Calculates effects based on the current balance.
 * A high balance (ethereal) might boost some plants, while a low balance (physical) boosts others.
 * @param state The current game state.
 * @returns An object with modifiers to be applied.
 */
export const getBalanceModifiers = (state: GameState): { physicalBoost: number, etherealBoost: number } => {
    const balance = state.balance; // 0-100

    // A simple linear mapping for demonstration.
    // 0 balance = 1.5x physical boost, 1.0x ethereal boost
    // 100 balance = 1.0x physical boost, 1.5x ethereal boost
    const physicalBoost = 1.5 - (balance / 200);
    const etherealBoost = 1.0 + (balance / 200);

    return { physicalBoost, etherealBoost };
};
