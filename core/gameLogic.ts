// core/gameLogic.ts

import { OwnedPlant } from '../types';

export const calculateChiPerSecond = (
    plants: Record<string, OwnedPlant>
): number => {
    let baseChi = 0;
    
    // Plant production
    for (const plantId in plants) {
        const plant = plants[plantId];
        let plantChi = plant.baseChi * plant.level;
        baseChi += plantChi;
    }

    return baseChi;
};