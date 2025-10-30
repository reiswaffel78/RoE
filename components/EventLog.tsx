// components/EventLog.tsx
import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const EventLog: React.FC = () => {
    const log = useGameStore(state => state.log);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md h-64 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 text-slate-200">Garden Log</h2>
            <div ref={logContainerRef} className="flex-grow overflow-y-auto pr-2">
                {log.map((entry, index) => (
                    <p key={index} className="text-sm text-slate-400 mb-1">{entry}</p>
                ))}
            </div>
        </div>
    );
};

export default EventLog;
