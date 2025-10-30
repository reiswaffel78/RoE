
import { create } from 'zustand';
import { GameState, Plant, Settings } from '../types';
import { calculateChiPerSecond } from '../core/gameLogic';
import { logger } from '../services/logger';

// A minimal getInitialState for the basic version of the game.
const getInitialState = (): Omit<GameState, 'tick' | 'buyPlant' | 'addChi' | 'importState' | 'addLog' | 'levelUpPlant' | 'buyUpgrade' | 'startRitual' | 'changeZone' | 'resolveEvent' | 'makeOffering' | 'updateSettings' | 'resetGame'> => ({
    chi: 10,
    chiPerSecond: 0,
    harmony: 0,
    harmonyPerSecond: 0,
    plants: {},
    lastUpdate: Date.now(),
    balance: 50,
    awareness: 'physical',
    unlockedZones: ['meadow'],
    currentZoneId: 'meadow',
    weather: 'clear',
    moonPhase: 'new',
    eventHistory: {},
    logs: ["The journey begins."],
    settings: {
        volume: 0.5,
        sfx: true,
        lowSpecMode: false,
    },
    ownedUpgrades: {},
    ritualCooldowns: {},
    activeRituals: [],
    spiritRelationships: {},
    currentEvent: null,
});

export const useGameStore = create<GameState>()(
    (set) => ({
        ...getInitialState(),

        tick: () => {
            set(state => {
                const now = Date.now();
                const elapsedSeconds = (now - state.lastUpdate) / 1000;
                if (elapsedSeconds <= 0) return {};

                const chiPerSecond = calculateChiPerSecond(state.plants);
                const chiGained = chiPerSecond * elapsedSeconds;
                const newChi = state.chi + chiGained;
                
                return {
                    chi: newChi,
                    chiPerSecond,
                    lastUpdate: now,
                };
            });
        },

        addChi: (amount) => {
            set(state => ({ chi: state.chi + amount }));
        },
        
        buyPlant: (plant: Plant) => {
            set(state => {
                const ownedPlant = state.plants[plant.id];
                if (ownedPlant || state.chi < plant.cost) return {};

                return {
                    chi: state.chi - plant.cost,
                    plants: {
                        ...state.plants,
                        [plant.id]: {
                            id: plant.id,
                            level: 1,
                            baseChi: plant.baseChi
                        }
                    },
                };
            });
        },

        levelUpPlant: (plantId: string, cost: number) => {
            set(state => {
                const plant = state.plants[plantId];
                if (!plant || state.chi < cost) return {};

                return {
                    chi: state.chi - cost,
                    plants: {
                        ...state.plants,
                        [plantId]: {
                            ...plant,
                            level: plant.level + 1,
                        }
                    }
                };
            });
        },

        addLog: (message: string) => {
            set(state => ({
                logs: [message, ...state.logs.slice(0, 4)]
            }));
        },

        updateSettings: (newSettings: Partial<Settings>) => {
            set(state => ({
                settings: { ...state.settings, ...newSettings }
            }));
        },
        
        resetGame: () => {
            set(getInitialState());
        },

        importState: (newState: Partial<GameState>) => {
            set(state => ({...state, ...newState, lastUpdate: Date.now() }));
        },

        // --- Placeholder Actions ---
        buyUpgrade: () => logger.warn("buyUpgrade action is not implemented yet."),
        startRitual: () => logger.warn("startRitual action is not implemented yet."),
        changeZone: () => logger.warn("changeZone action is not implemented yet."),
        resolveEvent: () => logger.warn("resolveEvent action is not implemented yet."),
        makeOffering: () => logger.warn("makeOffering action is not implemented yet."),

    })
);

logger.info("gameStore: Zustand store created for full version.");