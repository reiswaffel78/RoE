
// components/UpgradeShop.tsx

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { initialUpgrades } from '../core/data';
import { formatNumber } from '../utils/format';
import { UpgradeIcon } from './Icons';

const UpgradeShop: React.FC = () => {
    const { chi, ownedUpgrades, buyUpgrade } = useGameStore(state => ({
        chi: state.chi,
        ownedUpgrades: state.ownedUpgrades,
        buyUpgrade: state.buyUpgrade,
    }));

    const getNextUpgradeCost = (baseCost: number, level: number) => {
        return Math.floor(baseCost * Math.pow(1.5, level));
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
            <h2 className="text-lg font-bold text-sky-300 mb-4">Upgrades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {initialUpgrades.map(upgrade => {
                    const currentLevel = ownedUpgrades[upgrade.id] || 0;
                    if (currentLevel >= upgrade.maxLevel) {
                        return (
                             <div key={upgrade.id} className="bg-slate-800/50 p-3 rounded-md ring-1 ring-slate-700 opacity-60">
                                <h3 className="font-semibold text-slate-100">{upgrade.name} <span className="text-xs text-sky-400 font-mono">Lv. {currentLevel}/{upgrade.maxLevel}</span></h3>
                                <p className="text-xs text-slate-400 mt-1">{upgrade.description}</p>
                                <div className="mt-2 text-sm text-center font-bold text-sky-300">MAX</div>
                            </div>
                        );
                    }

                    const cost = getNextUpgradeCost(upgrade.cost, currentLevel);
                    const canAfford = chi >= cost;

                    return (
                        <div key={upgrade.id} className="bg-slate-800/50 p-3 rounded-md ring-1 ring-slate-700 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-100">{upgrade.name} <span className="text-xs text-slate-400 font-mono">Lv. {currentLevel}/{upgrade.maxLevel}</span></h3>
                                <p className="text-xs text-slate-400 mt-1">{upgrade.description}</p>
                            </div>
                            <button
                                onClick={() => buyUpgrade(upgrade)}
                                disabled={!canAfford}
                                className={`w-full mt-3 px-3 py-1.5 text-sm font-semibold rounded ${
                                    canAfford
                                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                                data-tooltip-id="app-tooltip"
                                data-tooltip-content={`Cost: ${formatNumber(cost)} Chi`}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    <UpgradeIcon className="h-4 w-4" />
                                    <span>Upgrade</span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpgradeShop;