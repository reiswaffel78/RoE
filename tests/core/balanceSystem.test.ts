// tests/core/balanceSystem.test.ts
import { describe, it, expect } from 'vitest';
import { getBalanceModifiers } from '../../core/balanceSystem';
import type { GameState } from '../../types';

describe('balanceSystem', () => {
    it('should provide maximum boost to physical at 0 balance', () => {
        const state = { balance: 0 } as GameState;
        const modifiers = getBalanceModifiers(state);
        expect(modifiers.physicalBoost).toBe(1.5);
        expect(modifiers.etherealBoost).toBe(1.0);
    });

    it('should provide maximum boost to ethereal at 100 balance', () => {
        const state = { balance: 100 } as GameState;
        const modifiers = getBalanceModifiers(state);
        expect(modifiers.physicalBoost).toBe(1.0);
        expect(modifiers.etherealBoost).toBe(1.5);
    });

    it('should provide balanced modifiers at 50 balance', () => {
        const state = { balance: 50 } as GameState;
        const modifiers = getBalanceModifiers(state);
        expect(modifiers.physicalBoost).toBe(1.25);
        expect(modifiers.etherealBoost).toBe(1.25);
    });
});
