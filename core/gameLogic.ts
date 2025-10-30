// core/gameLogic.ts
import { GameState, Plant } from '../types';
import { getBalanceModifiers } from './balanceSystem';
import { getZoneModifier } from './environmentalSystem';
import { gameEvents } from './events';
import { initialAchievements } from './data';

/**
 * The main game loop logic.
 * @param state The current game state.
 * @param deltaTime The time in seconds since the last update.
 * @returns The new game state.
 */
export const tick = (state: GameState, deltaTime: number): GameState => {
    let newState = { ...state };

    // 1. Calculate Modifiers
    const balanceMods = getBalanceModifiers(newState);
    const zoneMods = getZoneModifier(newState);

    // 2. Calculate Chi Per Second (CPS)
    let totalCps = 0;
    for (const plantId in newState.plants) {
        const plant = newState.plants[plantId] as Plant;
        if (plant.level > 0) {
            let plantCps = plant.cpsBase * plant.level;
            
            // Apply modifiers
            if (plant.type === 'physical') {
                plantCps *= balanceMods.physicalBoost * zoneMods.physical;
            } else {
                plantCps *= balanceMods.etherealBoost * zoneMods.ethereal;
            }
            totalCps += plantCps;
        }
    }
    
    // Prestige bonus (e.g. 10% per point)
    const prestigeBonus = 1 + (newState.prestige.points * 0.1);
    totalCps *= prestigeBonus;


    // 3. Update resources
    const chiGained = totalCps * deltaTime;
    newState.chi += chiGained;
    newState.totalChi += chiGained;
    newState.playTime += deltaTime;

    // 4. Check for new events
    if (!newState.currentEvent) {
        for (const event of gameEvents) {
            if (event.trigger(newState)) {
                newState.currentEvent = event;
                newState.log = [...newState.log, `A strange feeling comes over the garden...`];
                break; // Only trigger one event per tick
            }
        }
    }

    // 5. Check for achievements
    for (const achievementId in newState.achievements) {
        const ach = newState.achievements[achievementId];
        if (!ach.unlocked && initialAchievements[achievementId].check(newState)) {
            ach.unlocked = true;
            newState.log = [...newState.log, `Achievement Unlocked: ${ach.name}`];
        }
    }
    
    // 6. Calculate pending prestige points
    // Example formula: 1 point for every 1e6 total chi, sqrt scaling
    newState.prestige.pendingPoints = Math.floor(Math.sqrt(newState.totalChi / 1e6));


    return newState;
};
