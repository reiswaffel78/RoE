
// components/Settings.tsx

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const Settings: React.FC = () => {
    const { settings, updateSettings, resetGame } = useGameStore(state => ({
        settings: state.settings,
        updateSettings: state.updateSettings,
        resetGame: state.resetGame,
    }));
    const [isOpen, setIsOpen] = useState(false);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset your game? All progress will be lost.")) {
            resetGame();
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
                title="Settings"
            >
                Settings
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800/90 rounded-lg p-6 ring-1 ring-slate-600 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-100">Settings</h2>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="volume" className="text-slate-300">Master Volume</label>
                                <input
                                    type="range"
                                    id="volume"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={settings.volume}
                                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                                    className="w-48"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="sfx" className="text-slate-300">Sound Effects</label>
                                <input
                                    type="checkbox"
                                    id="sfx"
                                    checked={settings.sfx}
                                    onChange={(e) => updateSettings({ sfx: e.target.checked })}
                                    className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="low-spec" className="text-slate-300">Low Spec Mode (disables particles)</label>
                                <input
                                    type="checkbox"
                                    id="low-spec"
                                    checked={settings.lowSpecMode}
                                    onChange={(e) => updateSettings({ lowSpecMode: e.target.checked })}
                                     className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-8 border-t border-slate-700 pt-6">
                            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                            <button
                                onClick={handleReset}
                                className="w-full mt-3 bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                Reset Game
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Settings;
