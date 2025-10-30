// components/OfflineProgressModal.tsx
import React from 'react';
import { formatTime } from '../utils/format';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';

interface OfflineProgressModalProps {
    secondsOffline: number;
    onClose: () => void;
}

const OfflineProgressModal: React.FC<OfflineProgressModalProps> = ({ secondsOffline, onClose }) => {
    const chi = useGameStore(state => state.chi);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold mb-2 text-emerald-300">Welcome Back!</h2>
                <p className="text-slate-300 mb-4">
                    While you were away for {formatTime(secondsOffline)}, your garden has been busy.
                </p>
                <p className="text-lg text-slate-100">
                    You now have <span className="font-bold text-emerald-400">{formatNumber(chi)}</span> Chi.
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default OfflineProgressModal;
