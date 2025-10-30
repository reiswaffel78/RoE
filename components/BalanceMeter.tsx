
import React from 'react';
import { useGameStore } from '../store/gameStore';

const BalanceMeter: React.FC = () => {
  const balance = useGameStore(state => state.balance);

  const getBarColor = () => {
    if (balance > 70) return 'bg-green-500';
    if (balance > 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getTextColor = () => {
    if (balance > 70) return 'text-green-300';
    if (balance > 40) return 'text-yellow-300';
    return 'text-red-300';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-300">Balance</span>
        <span className={`text-sm font-bold ${getTextColor()}`}>{balance.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${balance}%` }}
        ></div>
      </div>
    </div>
  );
};

export default BalanceMeter;
