
// components/ZoneMap.tsx

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { initialZones } from '../core/data';
import { formatNumber } from '../utils/format';
import { MapIcon } from './Icons';

const ZoneMap: React.FC = () => {
    const { chi, currentZoneId, unlockedZones, changeZone } = useGameStore(state => ({
        chi: state.chi,
        currentZoneId: state.currentZoneId,
        unlockedZones: state.unlockedZones,
        changeZone: state.changeZone,
    }));

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
            <h2 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2"><MapIcon className="h-5 w-5" /> World</h2>
            <div className="flex flex-col gap-3">
                {initialZones.map(zone => {
                    const isCurrent = zone.id === currentZoneId;
                    const isUnlocked = unlockedZones.includes(zone.id);
                    const canAfford = chi >= zone.unlockCost;

                    let buttonText = "Travel";
                    if (isCurrent) buttonText = "Current Zone";
                    else if (!isUnlocked) buttonText = `Unlock (${formatNumber(zone.unlockCost)})`;

                    return (
                        <div key={zone.id} className={`p-3 rounded-md ring-1 ${isCurrent ? 'bg-amber-800/30 ring-amber-600/70' : 'bg-slate-800/50 ring-slate-700'}`}>
                            <h3 className="font-semibold text-slate-100">{zone.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">{zone.description}</p>
                            <p className="text-xs text-amber-300/80 mt-1 font-mono">Chi: x{zone.modifiers.chi.toFixed(1)}, Harmony: x{zone.modifiers.harmony.toFixed(1)}</p>
                            
                            {!isCurrent && (
                                <button
                                    onClick={() => changeZone(zone.id)}
                                    disabled={!isUnlocked && !canAfford}
                                    className={`w-full mt-3 px-3 py-1.5 text-sm font-semibold rounded transition-colors ${
                                        (isUnlocked || canAfford)
                                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {buttonText}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ZoneMap;
