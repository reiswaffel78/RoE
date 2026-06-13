// components/ZoneMap.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import type { Zone } from '../types';

const ZoneMap: React.FC = () => {
    const { t } = useTranslation();
    const { zones, currentZoneId, actions } = useGameStore(
        useShallow(state => ({
            zones: state.zones,
            currentZoneId: state.currentZoneId,
            actions: state.actions,
        })),
    );
    const state = useGameStore.getState();

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-blue-200">{t('zones.title')}</h2>
            <div className="flex gap-2">
                {Object.values(zones).map((zone: Zone) => {
                    const isUnlocked = zone.unlockCondition(state);
                    const isCurrent = zone.id === currentZoneId;
                    return (
                        <button
                            key={zone.id}
                            onClick={() => actions.changeZone(zone.id)}
                            disabled={!isUnlocked || isCurrent}
                            className={`p-2 rounded flex-1 text-center ${isCurrent ? 'bg-blue-600' : 'bg-blue-800'} ${isUnlocked ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <p className="font-bold">{t(`zones.${zone.id}.name`, zone.name)}</p>
                            <p className="text-xs">{t(`zones.${zone.id}.description`, zone.description)}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ZoneMap;
