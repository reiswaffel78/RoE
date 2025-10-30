// store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameStore } from '../types';
import { getInitialState } from '../core/data';
import { tick } from '../core/gameLogic';

const SAVE_KEY = 'zen-garden-save';

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...getInitialState(),
            actions: {
                tick: (deltaTime: number) => {
                    set(state => tick(state, deltaTime));
                },
                levelUpPlant: (plantId: string) => {
                    const state = get();
                    const plant = state.plants[plantId];
                    if (!plant) return;
                    
                    const cost = plant.costBase * Math.pow(plant.costScaling, plant.level);
                    if (state.chi >= cost) {
                        set(s => ({
                            chi: s.chi - cost,
                            plants: {
                                ...s.plants,
                                [plantId]: { ...plant, level: plant.level + 1 },
                            },
                        }));
                    }
                },
                performRitual: (ritualId: string) => {
                    const state = get();
                    const ritual = state.rituals[ritualId];
                    if (!ritual || state.chi < ritual.cost) return;

                    const changes = ritual.effect(state);
                    set(s => ({
                        ...changes,
                        chi: s.chi - ritual.cost,
                    }));
                },
                changeZone: (zoneId: string) => {
                    const state = get();
                    if (state.zones[zoneId] && state.zones[zoneId].unlockCondition(state)) {
                        set({ currentZoneId: zoneId, log: [...state.log, `You moved to the ${state.zones[zoneId].name}.`] });
                    }
                },
                resolveEvent: (choiceIndex: number) => {
                    const state = get();
                    const event = state.currentEvent;
                    if (!event || !event.choices[choiceIndex]) return;

                    const choice = event.choices[choiceIndex];
                    const changes = choice.effect(state);
                    set(s => ({
                        ...changes,
                        currentEvent: null, // Event is resolved
                    }));
                },
                importState: (newState: GameState) => {
                    // Perform migration/validation if necessary
                    set({ ...newState, lastUpdate: Date.now() });
                },
                reset: () => {
                    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
                        set(getInitialState());
                    }
                },
                prestige: () => {
                    const state = get();
                    if (state.prestige.pendingPoints <= 0) return;
                    
                    const newPoints = state.prestige.points + state.prestige.pendingPoints;
                    const baseState = getInitialState();

                    set({
                        ...baseState,
                        prestige: {
                            points: newPoints,
                            pendingPoints: 0,
                        },
                        achievements: state.achievements, // Keep achievements
                        log: [...baseState.log, `You have prestiged, gaining wisdom from the past.`]
                    });
                },
                clearOfflineReport: () => {
                    set({ offlineReport: null });
                },
                // Dev actions
                addChi: (amount: number) => {
                    set(state => ({ chi: state.chi + amount, totalChi: state.totalChi + amount }));
                }
            },
        }),
        {
            name: SAVE_KEY,
            partialize: ({ actions, ...rest }) => rest,
            // FIX: Replaced incorrect `onFinishHydration` with `onRehydrateStorage`.
            // The inner callback runs after hydration is complete, allowing for offline progress calculation.
            onRehydrateStorage: () => (hydratedState, error) => {
                if (error) {
                    console.error("Failed to hydrate state:", error);
                    return;
                }
                if (!hydratedState) {
                    return;
                }

                const now = Date.now();
                // lastUpdate is from the persisted state.
                const lastUpdate = hydratedState.lastUpdate ?? now;
                const secondsOffline = Math.floor((now - lastUpdate) / 1000);
                
                if (secondsOffline > 10) {
                    const stateBefore = hydratedState;
                    
                    // Cap offline time to 24 hours to prevent exploitation
                    const cappedSeconds = Math.min(secondsOffline, 24 * 60 * 60); 
                    const stateAfter = tick(stateBefore, cappedSeconds);
                    const chiGained = stateAfter.chi - stateBefore.chi;

                    if (chiGained > 0) {
                        const report = { secondsOffline: cappedSeconds, chiGained };
                        // FIX: Use `useGameStore.setState` to update the store post-hydration.
                        useGameStore.setState({ ...stateAfter, lastUpdate: now, offlineReport: report });
                    } else {
                        // FIX: Use `useGameStore.setState` to update the store post-hydration.
                        useGameStore.setState({ lastUpdate: now });
                    }
                }
            },
        }
    )
);