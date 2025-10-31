// store/gameStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameStore, OfflineReport } from '../types';
import { getInitialState, normalizeState } from '../core/data';
import { tick, calculatePlantCost } from '../core/gameLogic';

const SAVE_KEY = 'zen-garden-save';
const MIN_OFFLINE_SECONDS = 10;
const OFFLINE_CAP_SECONDS = 24 * 60 * 60;

const extractGameState = (state: GameStore): GameState => {
    const { actions, ...gameState } = state;
    return gameState;
};

const mergeOfflineReport = (state: GameStore, nextState: GameState, report: OfflineReport | null, timestamp: number): GameStore => ({
    ...state,
    ...nextState,
    lastUpdate: timestamp,
    offlineReport: report,
});

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...getInitialState(),
            actions: {
                tick: (deltaTime: number) => {
                                        const now = Date.now();
                    set(state => {
                        const safeDelta = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0;
                        if (safeDelta === 0) {
                            return { ...state, lastUpdate: now };
                        }

                        const nextState = tick(extractGameState(state), safeDelta);
                        return {
                            ...state,
                            ...nextState,
                            lastUpdate: now,
                        };
                    });
                },
                levelUpPlant: (plantId: string) => {
                    set(state => {
                        const plant = state.plants[plantId];
                        if (!plant) {
                            return state;
                        }

                        const cost = calculatePlantCost(plant);
                        if (state.chi < cost) {
                            return state;
                        }

                        return {
                            ...state,
                            chi: state.chi - cost,
                            plants: {
                                ...state.plants,
                                [plantId]: { ...plant, level: plant.level + 1 },
                            },
                        };
                    });

                },
                performRitual: (ritualId: string) => {
                    set(state => {
                        const ritual = state.rituals[ritualId];
                        if (!ritual) {
                            return state;
                        }

                        if (state.chi < ritual.cost) {
                            return state;
                        }

                        const changes = ritual.effect(extractGameState(state));
                        return {
                            ...state,
                            ...changes,
                            chi: state.chi - ritual.cost,
                        };
                    });
                },
                changeZone: (zoneId: string) => {
                    set(state => {
                        const zone = state.zones[zoneId];
                        if (!zone || !zone.unlockCondition(extractGameState(state))) {
                            return state;
                        }

                        return {
                            ...state,
                            currentZoneId: zoneId,
                            log: [...state.log, `You moved to the ${zone.name}.`],
                        };
                    });
                },
                resolveEvent: (choiceIndex: number) => {
                    set(state => {
                        const event = state.currentEvent;
                        if (!event || !event.choices[choiceIndex]) {
                            return state;
                        }

                        const choice = event.choices[choiceIndex];
                        const changes = choice.effect(extractGameState(state));
                        return {
                            ...state,
                            ...changes,
                            currentEvent: null,
                        };
                    });
                },
                importState: (newState: GameState) => {
                    const normalized = normalizeState(newState);
                    set(state => ({
                        ...state,
                        ...normalized,
                        lastUpdate: Date.now(),
                    }));
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
                        achievements: state.achievements,
                        log: [...baseState.log, 'You have prestiged, gaining wisdom from the past.'],
                        actions: state.actions,
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

            onRehydrateStorage: () => (hydratedState, error) => {
                if (error) {
                    console.error("Failed to hydrate state:", error);
                    return;
                }

                const now = Date.now();
                 const normalized = normalizeState(hydratedState ?? undefined);
                const secondsOffline = Math.max(0, Math.floor((now - normalized.lastUpdate) / 1000));

                let nextState = normalized;
                let report: OfflineReport | null = null;

                if (secondsOffline > MIN_OFFLINE_SECONDS) {
                    const cappedSeconds = Math.min(secondsOffline, OFFLINE_CAP_SECONDS);
                    nextState = tick(normalized, cappedSeconds);
                    const chiGained = nextState.chi - normalized.chi;


                    if (chiGained > 0) {
                        report = { secondsOffline: cappedSeconds, chiGained };
                    }
                }

                useGameStore.setState(state => mergeOfflineReport(state, nextState, report, now));                
            },
        }
    )
);