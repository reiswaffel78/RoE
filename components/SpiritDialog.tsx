
// components/SpiritDialog.tsx

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { initialSpirits, initialOfferings } from '../core/data';
import { formatNumber } from '../utils/format';
import { UsersIcon } from './Icons';

const SpiritDialog: React.FC = () => {
    const { chi, spiritRelationships, makeOffering } = useGameStore(state => ({
        chi: state.chi,
        spiritRelationships: state.spiritRelationships,
        makeOffering: state.makeOffering,
    }));
    
    if (initialSpirits.length === 0) {
        return (
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
                <h2 className="text-lg font-bold text-violet-300 mb-4 flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Spirits
                </h2>
                <p className="text-sm text-slate-400">The spirits are quiet for now.</p>
            </div>
        );
    }

    const [selectedSpiritId, setSelectedSpiritId] = useState<string>(initialSpirits[0].id);
    const selectedSpirit = initialSpirits.find(s => s.id === selectedSpiritId)!;
    const relationship = spiritRelationships[selectedSpiritId] || 0;

    const getAffinityBonus = (spiritTags: string[], offeringTags: string[]): number => {
        const matchingTags = offeringTags.filter(tag => spiritTags.includes(tag));
        return matchingTags.length * 5; // e.g., 5 bonus points per matching tag
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
            <h2 className="text-lg font-bold text-violet-300 mb-4 flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Spirits
            </h2>

            <div className="flex gap-2 mb-4 border-b border-slate-700">
                {initialSpirits.map(spirit => (
                    <button
                        key={spirit.id}
                        onClick={() => setSelectedSpiritId(spirit.id)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-t-md transition-colors ${
                            selectedSpiritId === spirit.id
                                ? 'bg-slate-700/50 text-violet-300'
                                : 'text-slate-400 hover:bg-slate-800/60'
                        }`}
                    >
                        {spirit.name}
                    </button>
                ))}
            </div>

            <div>
                <p className="text-xs text-slate-400 italic mb-4">{selectedSpirit.description}</p>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Relationship</label>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div
                          className="bg-violet-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${relationship}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Blessings</h4>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                        {selectedSpirit.blessings.map(blessing => (
                            <li key={blessing.description} className={`${relationship >= blessing.threshold ? 'text-violet-300' : 'opacity-50'}`}>
                                {blessing.description} (Requires {blessing.threshold} relationship)
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                     <h4 className="font-semibold text-slate-200 mb-2">Make an Offering</h4>
                     <div className="grid grid-cols-2 gap-2">
                        {initialOfferings.map(offering => {
                            const canAfford = chi >= offering.costChi;
                            const affinityBonus = getAffinityBonus(selectedSpirit.affinityTags, offering.affinityTags);
                            const tooltipContent = `Cost: ${formatNumber(offering.costChi)} Chi. ${affinityBonus > 0 ? `+${affinityBonus} bonus relationship from affinity.` : ''}`;
                            return (
                                <button
                                    key={offering.id}
                                    onClick={() => makeOffering(selectedSpirit.id, offering, affinityBonus)}
                                    disabled={!canAfford}
                                    className={`text-xs text-left p-2 rounded transition-colors ${
                                        canAfford ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                                    data-tooltip-id="app-tooltip"
                                    data-tooltip-content={tooltipContent}
                                >
                                    <span className="font-semibold text-slate-300">{offering.name}</span>
                                    <p className="text-slate-400">{offering.description}</p>
                                </button>
                            );
                        })}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SpiritDialog;