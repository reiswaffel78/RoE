// components/RitualPanel.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';

const RitualPanel: React.FC = () => {
    // FIX: Destructuring with a rest parameter was creating an incomplete state object.
    // Get the full state object first, then destructure needed properties.
    const state = useGameStore(state => state);
    const { rituals, chi, actions } = state;

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-purple-200">Rituals</h2>
            <div className="grid grid-cols-2 gap-2">
                {Object.values(rituals).filter(r => r.isUnlocked(state)).map(ritual => (
                    <button
                        key={ritual.id}
                        onClick={() => actions.performRitual(ritual.id)}
                        disabled={chi < ritual.cost}
                        className="bg-purple-700 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white p-2 rounded text-center"
                    >
                        <p className="font-bold">{ritual.name}</p>
                        <p className="text-sm">{ritual.description}</p>
                        <p className="text-xs">Cost: {formatNumber(ritual.cost)}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RitualPanel;