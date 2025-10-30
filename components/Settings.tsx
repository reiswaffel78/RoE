// components/Settings.tsx
import React, { useRef } from 'react';
import { exportGameData, importGameData } from '../services/storage';
import { useGameStore } from '../store/gameStore';
import useAudioController from '../hooks/useAudioController';

interface SettingsProps {
    onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const { importState, reset } = useGameStore(state => state.actions);
    const importInputRef = useRef<HTMLInputElement>(null);

    const {
        musicVolume,
        sfxVolume,
        isMusicMuted,
        isSfxMuted,
        setMusicVolume,
        setSfxVolume,
        toggleMusic,
        toggleSfx,
    } = useAudioController();

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Audio</h3>
                    {/* Audio controls would be implemented here using useAudioController hook */}
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Data Management</h3>
                    <div className="flex gap-2">
                        <button onClick={exportGameData} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                            Export Save
                        </button>
                        <button onClick={handleImportClick} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">
                            Import Save
                        </button>
                        <input
                            type="file"
                            accept=".json"
                            ref={importInputRef}
                            className="hidden"
                            onChange={(e) => importGameData(e, importState)}
                        />
                    </div>
                </div>
                 <div className="mt-4 border-t border-slate-700 pt-4">
                     <button onClick={reset} className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full">
                        Reset Progress
                    </button>
                </div>


                <button onClick={onClose} className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded w-full">
                    Close
                </button>
            </div>
        </div>
    );
};

export default Settings;
