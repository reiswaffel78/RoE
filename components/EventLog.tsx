// components/EventLog.tsx
import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';

const EventLog: React.FC = () => {
    const { t } = useTranslation();
    const log = useGameStore(state => state.log);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md h-64 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 text-slate-200">{t('log.title')}</h2>
            <div ref={logContainerRef} className="flex-grow overflow-y-auto pr-2">
                {log.map((entry, index) => {
                    // Resolve data-driven names (zone/achievement) into translated params.
                    const params: Record<string, string | number> = { ...(entry.params ?? {}) };
                    if (params.zoneId !== undefined) {
                        params.zone = t(`zones.${params.zoneId}.name`, String(params.zoneId));
                    }
                    if (params.achievementId !== undefined) {
                        params.name = t(`achievements.${params.achievementId}.name`, String(params.achievementId));
                    }
                    return (
                        <p key={index} className="text-sm text-slate-400 mb-1">{t(entry.key, params)}</p>
                    );
                })}
            </div>
        </div>
    );
};

export default EventLog;
