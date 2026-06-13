// components/PlantPanel.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import type { Plant } from '../types';
import { calculatePlantCost } from '../core/gameLogic';

const PlantPanel: React.FC = () => {
    const { t } = useTranslation();
    const { plants, chi, totalChi, actions } = useGameStore(useShallow(state => ({
        plants: state.plants,
        chi: state.chi,
        totalChi: state.totalChi,
        actions: state.actions,
    })));

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-emerald-200">{t('plants.title')}</h2>
            <div className="space-y-2">
                {Object.values(plants).map((plant: Plant) => {
                    // Reveal a plant once it has been purchased, or once the player
                    // is within reach of affording it (teaser to drive progression).
                    const isRevealed = plant.level > 0 || plant.id === 'p1' || totalChi >= plant.costBase * 0.5;
                    if (!isRevealed) return null;
                    const cost = calculatePlantCost(plant);
                    return (
                        <div key={plant.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                            <div>
                                <p className="font-bold">{t(`plants.${plant.id}.name`, plant.name)} <span className="text-sm text-slate-400">{t('plants.level')} {plant.level}</span></p>
                                <p className="text-xs text-slate-400">{t(`plants.${plant.id}.description`, plant.description)}</p>
                            </div>
                            <button
                                onClick={() => actions.levelUpPlant(plant.id)}
                                disabled={chi < cost}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded"
                            >
                                {t('plants.levelUp', { cost: formatNumber(cost) })}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlantPanel;
