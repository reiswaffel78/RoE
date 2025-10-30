// components/DevMenu.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';

interface DevMenuProps {
    onClose: () => void;
}

const DevMenu: React.FC<DevMenuProps> = ({ onClose }) => {
    const { chi, actions } = useGameStore(state => ({
        chi: state.chi,
        actions: state.actions,
    }));

    const chiAmounts = [1000, 1e6, 1e9, 1e12];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-red-400">Dev Menu</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Add Chi</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {chiAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => actions.addChi(amount)}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
                                >
                                    + {formatNumber(amount)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Add more dev tools here */}
                </div>
                <button onClick={onClose} className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded w-full">
                    Close
                </button>
            </div>
        </div>
    );
};

export default DevMenu;
