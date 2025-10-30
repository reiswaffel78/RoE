
// components/RitualPanel.tsx

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { initialRituals } from '../core/data';
import { formatNumber } from '../utils/format';
import { SparklesIcon } from './Icons';

const RitualPanel: React.FC = () => {
    const { chi, harmony, awareness, startRitual, ritualCooldowns, activeRituals } = useGameStore(state => ({
        chi: state.chi,
        harmony: state.harmony,
        awareness: state.awareness,
        startRitual: state.startRitual,
        ritualCooldowns: state.ritualCooldowns,
        activeRituals: state.activeRituals,
    }));
    
    // For rendering cooldown timers
    const [, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const isAwarenessSufficient = (required: string) => {
        if (required === 'physical') return true;
        if (required === 'ethereal' && (awareness === 'ethereal' || awareness === 'astral')) return true;
        if (required === 'astral' && awareness === 'astral') return true;
        return false;
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 ring-1 ring-slate-700/50">
            <h2 className="text-lg font-bold text-fuchsia-300 mb-4">Rituals</h2>
            <div className="flex flex-col gap-3">
                {initialRituals.map(ritual => {
                    const cooldownEnds = ritualCooldowns[ritual.id] || 0;
                    const now = Date.now();
                    const secondsLeft = Math.ceil((cooldownEnds - now) / 1000);
                    const onCooldown = secondsLeft > 0;
                    
                    const isActive = activeRituals.some(r => r.id === ritual.id);

                    const canAfford = chi >= ritual.costChi && harmony >= (ritual.costHarmony || 0);
                    const meetsAwareness = isAwarenessSufficient(ritual.requiredAwareness);
                    const canPerform = canAfford && !onCooldown && !isActive && meetsAwareness;
                    
                    if (!meetsAwareness) return null;

                    return (
                        <div key={ritual.id} className="bg-slate-800/50 p-3 rounded-md ring-1 ring-slate-700">
                            <h3 className="font-semibold text-slate-100">{ritual.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">{ritual.description}</p>
                            <div className="text-xs text-slate-400 mt-2">
                                Cost: {formatNumber(ritual.costChi)} Chi
                                {ritual.costHarmony ? ` & ${formatNumber(ritual.costHarmony)} Harmony` : ''}
                            </div>
                             <div className="text-xs text-slate-400">Duration: {ritual.durationSec}s</div>
                            <button
                                onClick={() => startRitual(ritual)}
                                disabled={!canPerform}
                                className={`w-full mt-3 px-3 py-1.5 text-sm font-semibold rounded transition-colors ${
                                    isActive ? 'bg-fuchsia-800 text-fuchsia-200 cursor-default' :
                                    onCooldown ? 'bg-slate-700 text-slate-400 cursor-default' :
                                    canPerform ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                                data-tooltip-id="app-tooltip"
                                data-tooltip-content={!meetsAwareness ? `Requires ${ritual.requiredAwareness} awareness` : ''}
                            >
                                {isActive ? "Active" : onCooldown ? `Cooldown: ${secondsLeft}s` : "Perform"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RitualPanel;