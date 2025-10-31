// tests/store/gameStore.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { getInitialState } from '../../core/data';

// Reset the store's state before each test
beforeEach(() => {
    useGameStore.setState(getInitialState());
});

afterEach(() => {
    vi.useRealTimers();
})

describe('gameStore actions', () => {
    it('levelUpPlant should increase level and decrease chi', () => {
        // Give player enough chi
        useGameStore.setState({ chi: 100 });
        const initialLevel = useGameStore.getState().plants.p1.level;
        
        useGameStore.getState().actions.levelUpPlant('p1');

        const state = useGameStore.getState();
        expect(state.plants.p1.level).toBe(initialLevel + 1);
        expect(state.chi).toBeLessThan(100);
    });

    it('levelUpPlant should not work if chi is insufficient', () => {
        useGameStore.setState({ chi: 0 });
        const initialState = useGameStore.getState();

        useGameStore.getState().actions.levelUpPlant('p1');

        expect(useGameStore.getState()).toEqual(initialState);
    });

    it('performRitual should apply effect and decrease chi', () => {
        useGameStore.setState({ chi: 100, balance: 50 });
        
        useGameStore.getState().actions.performRitual('r1'); // Meditation

        const state = useGameStore.getState();
        expect(state.balance).toBe(55);
        expect(state.chi).toBe(50);
    });
});


describe('gameStore persistence and offline progress', () => {
    it('should calculate offline progress on rehydration', () => {
        vi.useFakeTimers();
        const baseTime = new Date('2024-01-01T00:00:00Z');
        vi.setSystemTime(baseTime);

        const oneHourAgo = Date.now() - 3600 * 1000;
        const initialState = getInitialState();
        initialState.lastUpdate = oneHourAgo;
        initialState.plants.p1.level = 5; // Give some CPS

        // FIX: Manually simulate the onRehydrateStorage logic
        const onRehydrateStorage = useGameStore.persist.getOptions().onRehydrateStorage;
        if (onRehydrateStorage) {
            // Manually set state to simulate hydration before the callback
            useGameStore.setState(initialState);
            const onFinish = onRehydrateStorage();
            if (onFinish) {
                onFinish(useGameStore.getState(), undefined);
            }
        } else {
            throw new Error('onRehydrateStorage function not found on persist options');
        }

        const state = useGameStore.getState();
        // Chi should be significantly more than the starting 10
        expect(state.chi).toBeGreaterThan(15);
        expect(state.lastUpdate).toBe(Date.now());
        expect(state.offlineReport).not.toBeNull();
        expect(state.offlineReport?.secondsOffline).toBe(3600);
        expect(state.offlineReport?.chiGained).toBeGreaterThan(0);

        vi.useRealTimers();
    });

    // FIX: Make test function async to allow await
    it('should cap offline progress at 24 hours', async () => {
        vi.useFakeTimers();
        const baseTime = new Date('2024-01-01T00:00:00Z');
        vi.setSystemTime(baseTime);

        // Simulate being offline for 30 hours
        const thirtyHoursAgo = Date.now() - 30 * 3600 * 1000;
        const initialState = getInitialState();
        initialState.lastUpdate = thirtyHoursAgo;
        initialState.plants.p1.level = 10;
        const initialChi = initialState.chi;
        
        // --- Calculate expected gain for 24 hours ---
        let expectedState = { ...initialState };
        // FIX: Remove incorrect assignment. The `tick` function does not require actions.
        const { tick } = await import('../../core/gameLogic');
        const stateAfter24h = tick(expectedState, 24 * 3600);
        const expectedChiGain = stateAfter24h.chi - initialChi;
        // --- End calculation ---

        // FIX: Manually simulate the onRehydrateStorage logic
        const onRehydrateStorage = useGameStore.persist.getOptions().onRehydrateStorage;
        if (onRehydrateStorage) {
            // Manually set state to simulate hydration before the callback
            useGameStore.setState(initialState);
            const onFinish = onRehydrateStorage();
            if (onFinish) {
                onFinish(useGameStore.getState(), undefined);
            }
        } else {
            throw new Error('onRehydrateStorage function not found on persist options');
        }

        const finalState = useGameStore.getState();
        const actualChiGain = finalState.chi - initialChi;

        // The actual gain should be close to the 24-hour capped gain, not the 30-hour gain.
        expect(actualChiGain).toBeCloseTo(expectedChiGain, -1);

        expect(finalState.offlineReport?.secondsOffline).toBe(24 * 3600);
        
        vi.useRealTimers();
    });
});