// components/RitualPanel.tsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import type { GameState } from '../types';

const RitualPanel: React.FC = () => {
    const { t } = useTranslation();
    const actions = useGameStore(state => state.actions);
    const { chi, rituals, plants, balance } = useGameStore(
        useShallow(state => ({
            chi: state.chi,
            rituals: state.rituals,
            plants: state.plants,
            balance: state.balance,
        })),
    );

    const fullState = useGameStore.getState() as GameState;

    const availableRituals = useMemo(
        () => Object.values(rituals).filter(ritual => ritual.isUnlocked(fullState)),
        [rituals, plants, balance],
    );

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-purple-200">{t('rituals.title')}</h2>
            {availableRituals.length === 0 ? (
                <p className="text-slate-400 text-sm">{t('rituals.locked')}</p>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {availableRituals.map(ritual => (
                        <button
                            key={ritual.id}
                            onClick={() => actions.performRitual(ritual.id)}
                            disabled={chi < ritual.cost}
                            className="bg-purple-700 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded text-center"
                        >
                            <p className="font-bold">{t(`rituals.${ritual.id}.name`, ritual.name)}</p>
                            <p className="text-sm">{t(`rituals.${ritual.id}.description`, ritual.description)}</p>
                            <p className="text-xs">{t('rituals.cost', { cost: formatNumber(ritual.cost) })}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RitualPanel;
