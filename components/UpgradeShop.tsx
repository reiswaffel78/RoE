// components/UpgradeShop.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import type { GameState } from '../types';

const UpgradeShop: React.FC = () => {
    const { t } = useTranslation();
    const { chi, upgrades, actions } = useGameStore(
        useShallow(state => ({
            chi: state.chi,
            upgrades: state.upgrades,
            actions: state.actions,
        })),
    );

    const fullState = useGameStore.getState() as GameState;

    // Show upgrades that are already owned or whose visibility condition is met.
    const visibleUpgrades = Object.values(upgrades).filter(
        upgrade => upgrade.unlocked || upgrade.isUnlocked(fullState),
    );

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-yellow-200">{t('upgrades.title')}</h2>
            {visibleUpgrades.length === 0 ? (
                <p className="text-slate-400">{t('upgrades.empty')}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visibleUpgrades.map(upgrade => {
                        const owned = upgrade.unlocked;
                        const affordable = chi >= upgrade.cost;
                        return (
                            <div
                                key={upgrade.id}
                                className={`flex justify-between items-center gap-2 p-2 rounded ${owned ? 'bg-yellow-700/40' : 'bg-slate-700/50'}`}
                            >
                                <div>
                                    <p className="font-bold">{t(`upgrades.${upgrade.id}.name`, upgrade.name)}</p>
                                    <p className="text-xs text-slate-300">{t(`upgrades.${upgrade.id}.description`, upgrade.description)}</p>
                                </div>
                                {owned ? (
                                    <span className="text-xs font-bold text-yellow-200 shrink-0">{t('upgrades.owned')}</span>
                                ) : (
                                    <button
                                        onClick={() => actions.buyUpgrade(upgrade.id)}
                                        disabled={!affordable}
                                        className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-1 px-3 rounded shrink-0 text-sm"
                                    >
                                        {t('upgrades.buy')} ({formatNumber(upgrade.cost)})
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UpgradeShop;
