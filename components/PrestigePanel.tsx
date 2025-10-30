// components/PrestigePanel.tsx
import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import PrestigeConfirmationModal from './PrestigeConfirmationModal';
import { formatNumber } from '../utils/format';

const PrestigePanel: React.FC = () => {
    const { points, pendingPoints } = useGameStore(state => state.prestige);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-cyan-200">Prestige</h2>
            <p className="text-sm text-slate-300">Current prestige points: {formatNumber(points)}</p>
            <p className="text-sm text-slate-300">Points on next reset: {formatNumber(pendingPoints)}</p>
            
            {pendingPoints > 0 && (
                 <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
                >
                    Prestige Now
                </button>
            )}

            {isModalOpen && <PrestigeConfirmationModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default PrestigePanel;
