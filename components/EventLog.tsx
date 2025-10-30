
import React from 'react';
import { useGameStore } from '../store/gameStore';

const EventLog: React.FC = () => {
  const logs = useGameStore(state => state.logs);

  return (
    <div className="h-24 bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 text-sm text-slate-400 overflow-hidden ring-1 ring-slate-700/50">
      <div className="flex flex-col-reverse">
        {logs.map((log, index) => (
          <p key={index} className={`transition-opacity duration-500 ${index === 0 ? 'opacity-100 text-slate-200' : 'opacity-60'}`}>
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};

export default EventLog;
