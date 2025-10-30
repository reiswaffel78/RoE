// components/PrestigeConfirmationModal.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';

interface PrestigeConfirmationModalProps {
    onClose: () => void;
}

const PrestigeConfirmationModal: React.FC<PrestigeConfirmationModalProps> = ({ onClose }) => {
    const { prestige } = useGameStore(state => state.actions);
    const { pendingPoints } = useGameStore(state => state.prestige);
    
    const handlePrestige = () => {
        prestige();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-2 text-cyan-300">Confirm Prestige</h2>
                <p className="text-slate-300 mb-4">
                    Are you sure you want to prestige? Your current progress will be reset,
                    but you will gain {pendingPoints} prestige point(s), making future runs faster.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePrestige}
                        className="flex-1 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrestigeConfirmationModal;
