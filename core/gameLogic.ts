// core/gameLogic.ts
import { GameState, Plant } from '../types';
import { getBalanceModifiers } from './balanceSystem';
import { getZoneModifier } from './environmentalSystem';
import { gameEvents } from './events';
import { initialAchievements } from './data';

const MAX_TICK_SECONDS = 60;

const clampPositiveFinite = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) {
        return 0;
    }
    return value;
};

const appendLogEntry = (state: GameState, log: string[], entry: string): string[] => {
    if (log === state.log) {
        return [...state.log, entry];
    }
    return [...log, entry];
};

const applySingleTick = (state: GameState, deltaSeconds: number): GameState => {
    const balanceMods = getBalanceModifiers(state);
    const zoneMods = getZoneModifier(state);
        let totalCps = 0;

    for (const plantId of Object.keys(state.plants)) {
        const plant: Plant | undefined = state.plants[plantId];
        if (!plant) {
            continue;
        }
        const level = Math.max(0, Math.floor(plant.level));
        if (level <= 0) {
            continue;
        }

        let plantCps = plant.cpsBase * level;
        if (plant.type === 'physical') {
            plantCps *= balanceMods.physicalBoost * zoneMods.physical;
        } else {
            plantCps *= balanceMods.etherealBoost * zoneMods.ethereal;
        }

        if (Number.isFinite(plantCps) && plantCps > 0) {
            totalCps += plantCps;
        }
    }
    
    totalCps *= 1 + state.prestige.points * 0.1;
    if (!Number.isFinite(totalCps) || totalCps < 0) {
        totalCps = 0;
    }

    const chiGained = totalCps * deltaSeconds;
    const nextChi = Number.isFinite(chiGained) ? Math.max(0, state.chi + chiGained) : state.chi;
    const nextTotalChi = Number.isFinite(chiGained) ? Math.max(0, state.totalChi + chiGained) : state.totalChi;
    const nextPlayTime = state.playTime + deltaSeconds;

    let log = state.log;
    let currentEvent = state.currentEvent;


    const stateForChecks: GameState = {
        ...state,
        chi: nextChi,
        totalChi: nextTotalChi,
        playTime: nextPlayTime,
        log,
        currentEvent,
    };

    // 4. Check for new events
     if (!currentEvent) {
        for (const event of gameEvents) {
            try {
                if (event.trigger(stateForChecks)) {
                    currentEvent = event;
                    log = appendLogEntry(state, log, 'A strange feeling comes over the garden...');
                    break;
                }
            } catch {
                // Defensive: ignore trigger failures
            }
        }
    }

    let achievements = state.achievements;
    for (const [achievementId, achievementState] of Object.entries(state.achievements)) {
        if (!achievementState) {
            continue;
        }

        const definition = initialAchievements[achievementId];
        if (!definition) {
            continue;
        }

        if (!achievementState.unlocked) {
            let shouldUnlock = false;
            try {
                shouldUnlock = definition.check(stateForChecks);
            } catch {
                shouldUnlock = false;
            }

            if (shouldUnlock) {
                if (achievements === state.achievements) {
                    achievements = { ...state.achievements };
                }
                achievements[achievementId] = { ...achievementState, unlocked: true };
                log = appendLogEntry(state, log, `Achievement Unlocked: ${achievementState.name}`);
            }
        }
    }

    const pendingPoints = Math.floor(Math.sqrt(nextTotalChi / 1e6));
    const prestige = {
        ...state.prestige,
        pendingPoints: Number.isFinite(pendingPoints) && pendingPoints > 0 ? pendingPoints : 0,
    };

    return {
        ...state,
        chi: nextChi,
        totalChi: nextTotalChi,
        playTime: nextPlayTime,
        log,
        currentEvent,
        achievements,
        prestige,

    };
};

export const tick = (state: GameState, deltaTime: number): GameState => {
    const safeDelta = clampPositiveFinite(deltaTime);
    if (safeDelta === 0) {
        return state;

    }
    
    let remaining = safeDelta;
    let workingState = state;

    while (remaining > 0) {
        const step = Math.min(remaining, MAX_TICK_SECONDS);
        workingState = applySingleTick(workingState, step);
        remaining -= step;
    }

    return workingState;
};


export const calculatePlantCost = (plant: Plant): number => {
    const level = Math.max(0, Math.floor(plant.level));
    const cost = plant.costBase * Math.pow(plant.costScaling, level);
    return Number.isFinite(cost) && cost > 0 ? cost : plant.costBase;
};
