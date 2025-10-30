
// components/EventModal.tsx

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GameEvent } from '../types';

interface EventModalProps {
    event: GameEvent;
}

const EventModal: React.FC<EventModalProps> = ({ event }) => {
    const resolveEvent = useGameStore(state => state.resolveEvent);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/90 rounded-lg p-6 ring-1 ring-slate-600 max-w-md w-full animate-fade-in">
                <h2 className="text-xl font-bold text-amber-300 mb-2">{event.title}</h2>
                <p className="text-slate-300 mb-6">{event.description}</p>
                <div className="flex flex-col gap-3">
                    {event.choices.map(choice => (
                        <button
                            key={choice.id}
                            onClick={() => resolveEvent(choice)}
                            className="w-full text-left bg-slate-700 hover:bg-slate-600/80 text-slate-200 px-4 py-3 rounded-md transition-colors"
                        >
                            {choice.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventModal;