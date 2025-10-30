
// components/PlantPanel.tsx

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { initialPlants } from '../core/data';
import { formatNumber } from '../utils/format';
import { LeafIcon } from './Icons';
import { Tooltip } from 'react-tooltip';

const PlantPanel: React.FC = () => {
    const { chi, plants, buyPlant, levelUpPlant } = useGameStore(state => ({
        chi: state.chi,
        plants: state.plants,
        buyPlant: state.buyPlant,
        levelUpPlant: state.levelUpPlant,
    }));

    const getNextLevelCost = (plantId: string, baseCost: number, level: number) => {
        return Math.floor(baseCost * Math.pow(1.15, level));
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
            <h2 className="text-lg font-bold text-emerald-300 mb-4">Cultivation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {initialPlants.map(plant => {
                    const ownedPlant = plants[plant.id];
                    if (!ownedPlant) {
                        const canAfford = chi >= plant.cost;
                        return (
                            <div key={plant.id} className="bg-slate-800/50 p-3 rounded-md ring-1 ring-slate-700">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-100">{plant.name}</h3>
                                        <p className="text-xs text-slate-400">{plant.description}</p>
                                    </div>
                                    <button
                                        onClick={() => buyPlant(plant)}
                                        disabled={!canAfford}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded ${
                                            canAfford 
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <LeafIcon className="h-4 w-4" />
                                            <span>{formatNumber(plant.cost)}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        );
                    } else {
                        const cost = getNextLevelCost(plant.id, plant.cost, ownedPlant.level);
                        const canAfford = chi >= cost;
                        return (
                             <div key={plant.id} className="bg-slate-800/70 p-3 rounded-md ring-1 ring-emerald-700/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-100">{plant.name} <span className="text-xs text-emerald-400 font-mono">Lv. {ownedPlant.level}</span></h3>
                                        <p className="text-xs text-slate-400">Producing {formatNumber(ownedPlant.baseChi * ownedPlant.level)} Chi/s</p>
                                    </div>
                                    <button
                                        onClick={() => levelUpPlant(plant.id, cost)}
                                        disabled={!canAfford}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded ${
                                            canAfford
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        }`}
                                        data-tooltip-id="app-tooltip"
                                        data-tooltip-content={`Upgrade for ${formatNumber(cost)} Chi`}
                                    >
                                       Level Up
                                    </button>
                                </div>
                            </div>
                        )
                    }
                })}
            </div>
        </div>
    );
};

export default PlantPanel;