// tests/core/gameLogic.test.ts
import { describe, it, expect } from 'vitest';
import { tick } from '../../core/gameLogic';
import { getInitialState } from '../../core/data';
import type { GameState } from '../../types';

describe('gameLogic', () => {
    it('should generate chi based on plant levels', () => {
        const initialState = getInitialState();
        initialState.plants.p1.level = 1;
        
        const stateAfter1s = tick(initialState, 1);
        const chiGained = stateAfter1s.chi - initialState.chi;
        
        expect(chiGained).toBeGreaterThan(0);
        
        const stateWithLevel10 = { ...initialState };
        stateWithLevel10.plants.p1.level = 10;
        const stateAfter1s_level10 = tick(stateWithLevel10, 1);
        const chiGained_level10 = stateAfter1s_level10.chi - stateWithLevel10.chi;

        expect(chiGained_level10).toBeGreaterThan(chiGained * 5); // Check for significant increase
    });

    it('should apply balance modifiers correctly', () => {
        const state = getInitialState();
        state.plants.p1.level = 1; // Physical plant
        state.plants.p3.level = 1; // Ethereal plant

        // State biased towards physical
        const physicalState = { ...state, balance: 0 };
        const physicalTick = tick(physicalState, 1);
        const physicalChiGain = physicalTick.chi - physicalState.chi;

        // State biased towards ethereal
        const etherealState = { ...state, balance: 100 };
        const etherealTick = tick(etherealState, 1);
        const etherealChiGain = etherealTick.chi - etherealState.chi;

        // With balance 0, the physical plant should be boosted.
        // With balance 100, the ethereal plant should be boosted.
        // It's hard to compare them directly without knowing exact numbers, but they should be different.
        expect(physicalChiGain).not.toEqual(etherealChiGain);
    });

    it('should apply zone modifiers correctly', () => {
        const state = getInitialState();
        state.plants.p1.level = 1; // Physical plant

        const baseTick = tick(state, 1);
        const baseChiGain = baseTick.chi - state.chi;

        const zone2State: GameState = { ...state, currentZoneId: 'z2' }; // Sun-dappled Meadow boosts physical
        const zone2Tick = tick(zone2State, 1);
        const zone2ChiGain = zone2Tick.chi - zone2State.chi;
        
        expect(zone2ChiGain).toBeGreaterThan(baseChiGain);
    });

    it('should apply prestige bonuses', () => {
        const state = getInitialState();
        state.plants.p1.level = 1;

        const noPrestigeTick = tick(state, 1);
        const noPrestigeChiGain = noPrestigeTick.chi - state.chi;

        const prestigeState: GameState = { ...state, prestige: { points: 10, pendingPoints: 0 } };
        const prestigeTick = tick(prestigeState, 1);
        const prestigeChiGain = prestigeTick.chi - prestigeState.chi;
        
        // 10 points = 10 * 0.1 = 100% bonus = 2x gain
        expect(prestigeChiGain).toBeCloseTo(noPrestigeChiGain * 2);
    });
});
