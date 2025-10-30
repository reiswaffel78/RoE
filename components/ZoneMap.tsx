// components/ZoneMap.tsx
import React from 'react';
import { useGameStore } from '../store/gameStore';

const ZoneMap: React.FC = () => {
    // FIX: Destructuring with a rest parameter was creating an incomplete state object.
    // Get the full state object first, then destructure needed properties.
    const state = useGameStore(state => state);
    const { zones, currentZoneId, actions } = state;

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-blue-200">Zones</h2>
            <div className="flex gap-2">
                {Object.values(zones).map(zone => {
                    const isUnlocked = zone.unlockCondition(state);
                    const isCurrent = zone.id === currentZoneId;
                    return (
                        <button
                            key={zone.id}
                            onClick={() => actions.changeZone(zone.id)}
                            disabled={!isUnlocked || isCurrent}
                            className={`p-2 rounded flex-1 text-center ${isCurrent ? 'bg-blue-600' : 'bg-blue-800'} ${isUnlocked ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <p className="font-bold">{zone.name}</p>
                            <p className="text-xs">{zone.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ZoneMap;