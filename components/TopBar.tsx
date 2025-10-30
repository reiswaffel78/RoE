// components/TopBar.tsx

import React, { useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import { LeafIcon, HeartIcon } from './Icons';
import BalanceMeter from './BalanceMeter';
import { exportGameData, importGameData } from '../services/storage';
import { GameState } from '../types';
import Settings from './Settings';

const TopBar: React.FC = () => {
    const chi = useGameStore(state => state.chi);
    const harmony = useGameStore(state => state.harmony);
    const chiPerSecond = useGameStore(state => state.chiPerSecond);
    const harmonyPerSecond = useGameStore(state => state.harmonyPerSecond);
    const importState = useGameStore(state => state.importState);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        importGameData(e, importState);
    };

    return (
        <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 sm:gap-6">
                    {/* Chi */}
                    <div className="flex items-center gap-2">
                        <LeafIcon className="h-6 w-6 text-emerald-400" />
                        <div>
                            <div className="text-xl font-bold text-slate-100">{formatNumber(chi)}</div>
                            <div className="text-xs text-slate-400 font-mono">
                                +{formatNumber(chiPerSecond)}/s
                            </div>
                        </div>
                    </div>
                    {/* Harmony */}
                    <div className="flex items-center gap-2">
                        <HeartIcon className="h-6 w-6 text-pink-400" />
                        <div>
                            <div className="text-xl font-bold text-slate-100">{formatNumber(harmony)}</div>
                            <div className="text-xs text-slate-400 font-mono">
                                +{formatNumber(harmonyPerSecond)}/s
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full sm:w-48">
                    <BalanceMeter />
                </div>
            </div>

            <div className="absolute top-2 right-2 flex gap-2 items-center">
                <Settings />
                <button
                    onClick={exportGameData}
                    className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                    title="Export Save"
                >
                    Export
                </button>
                <button
                    onClick={handleImportClick}
                    className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                    title="Import Save"
                >
                    Import
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    className="hidden"
                    accept=".json"
                />
            </div>
        </div>
    );
};

export default TopBar;