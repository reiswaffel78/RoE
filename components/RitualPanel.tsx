// components/RitualPanel.tsx
import React, { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import type { Ritual } from '../types';

const RitualPanel: React.FC = () => {
    // FIX: Destructuring with a rest parameter was creating an incomplete state object.
    // Get the full state object first, then destructure needed properties.
    const actions = useGameStore(state => state.actions);
    const gameSnapshot = useGameStore(
        state => ({
            chi: state.chi,
            rituals: state.rituals,
            plants: state.plants,
            balance: state.balance,
            zones: state.zones,
            upgrades: state.upgrades,
            achievements: state.achievements,
            prestige: state.prestige,
            currentZoneId: state.currentZoneId,
            log: state.log,
            lastUpdate: state.lastUpdate,
            currentEvent: state.currentEvent,
            totalChi: state.totalChi,
            playTime: state.playTime,
            offlineReport: state.offlineReport,
        }),
        shallow
    );

    const availableRituals = useMemo(() => {
        const fullState = gameSnapshot as GameState;
        return Object.values(gameSnapshot.rituals).filter(ritual => ritual.isUnlocked(fullState));
    }, [
        gameSnapshot.rituals,
        gameSnapshot.plants,
        gameSnapshot.balance,
        gameSnapshot.zones,
        gameSnapshot.upgrades,
        gameSnapshot.achievements,
        gameSnapshot.prestige,
        gameSnapshot.currentZoneId,
        gameSnapshot.log,
        gameSnapshot.totalChi,
        gameSnapshot.playTime,
        gameSnapshot.offlineReport,
    ]);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-purple-200">Rituals</h2>
            <div className="grid grid-cols-2 gap-2">
                {/* FIX: Add explicit type for `r` and `ritual` to resolve properties on `unknown` type error. */}
                {availableRituals.map(ritual => (
                    <button
                        key={ritual.id}
                        onClick={() => actions.performRitual(ritual.id)}
                         disabled={gameSnapshot.chi < ritual.cost}
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
