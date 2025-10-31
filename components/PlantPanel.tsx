// components/PlantPanel.tsx
import React from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import type { Plant } from '../types';
import { calculatePlantCost } from '../core/gameLogic';

const PlantPanel: React.FC = () => {
    const { plants, chi, actions } = useGameStore(state => ({
        plants: state.plants,
        chi: state.chi,
        actions: state.actions,
    }), shallow);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-emerald-200">Plants</h2>
            <div className="space-y-2">
                {/* FIX: Add explicit type for `plant` to resolve properties on `unknown` type error. */}
                {Object.values(plants).map((plant: Plant) => {
                    if (plant.level === 0 && plant.id !== 'p1') return null; // Hide unpurchased
                    const cost = calculatePlantCost(plant);
                    return (
                        <div key={plant.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
                            <div>
                                <p className="font-bold">{plant.name} <span className="text-sm text-slate-400">Lv. {plant.level}</span></p>
                                {/* Add CPS display here later */}
                            </div>
                            <button
                                onClick={() => actions.levelUpPlant(plant.id)}
                                disabled={chi < cost}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded"
                            >
                                Lvl Up ({formatNumber(cost)})
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlantPanel;
