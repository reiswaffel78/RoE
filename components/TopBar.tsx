// components/TopBar.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import BalanceMeter from './BalanceMeter';
import { LeafIcon } from './Icons';

interface TopBarProps {
    onSettingsClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSettingsClick }) => {
    const chi = useGameStore(state => state.chi);

    return (
        <header className="bg-slate-950/50 backdrop-blur-sm p-4 sticky top-0 z-20 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-emerald-300">Zen Garden</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                        <LeafIcon className="w-5 h-5 text-emerald-400" />
                        <span className="text-lg font-semibold">{formatNumber(chi)}</span>
                    </div>
                    <div className="w-48">
                        <BalanceMeter />
                    </div>
                    <button onClick={onSettingsClick} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md">
                        Settings
                    </button>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
