// components/PrestigePanel.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import PrestigeConfirmationModal from './PrestigeConfirmationModal';
import { formatNumber } from '../utils/format';

const PrestigePanel: React.FC = () => {
    const { t } = useTranslation();
    const { points, pendingPoints } = useGameStore(useShallow(state => state.prestige));
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-cyan-200">{t('prestige.title')}</h2>
            <p className="text-sm text-slate-300">{t('prestige.current', { points: formatNumber(points) })}</p>
            <p className="text-sm text-slate-300">{t('prestige.next', { points: formatNumber(pendingPoints) })}</p>

            {pendingPoints > 0 && (
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
                >
                    {t('prestige.action')}
                </button>
            )}

            {isModalOpen && <PrestigeConfirmationModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default PrestigePanel;
