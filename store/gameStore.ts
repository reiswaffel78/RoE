// store/gameStore.ts
// FIX: Use named import for create from zustand v4
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
                // Dev actions
                addChi: (amount: number) => {
                    set(state => ({ chi: state.chi + amount, totalChi: state.totalChi + amount }));
                }
            },
        }),
        {
            name: SAVE_KEY,
            // Only store the state, not the actions
            partialize: ({ actions, ...rest }) => rest,
            // FIX: Replaced deprecated `onRehydrate` with `onFinishHydration` and implemented correct logic
            onFinishHydration: () => {
                console.log("Rehydrating state finished.");
                const state = useGameStore.getState();
                // Handle offline progress on load
                const lastUpdate = state?.lastUpdate ?? Date.now();
                const now = Date.now();
                const secondsOffline = Math.floor((now - lastUpdate) / 1000);
                
                if (secondsOffline > 10) { // Only calculate for >10s offline
                    console.log(`Offline for ${secondsOffline} seconds.`);
                    let offlineState = { ...state };
                    // Cap offline time to 24 hours to prevent exploitation
                    const cappedSeconds = Math.min(secondsOffline, 24 * 60 * 60); 
                    offlineState = tick(offlineState, cappedSeconds);
                    
                    // Set the rehydrated state with offline progress applied
                    useGameStore.setState({ ...offlineState, lastUpdate: now });
                }
            },
        }
    )
);