// components/EventModal.tsx
import React from 'react';
import { GameEvent } from '../types';
import { useGameStore } from '../store/gameStore';

interface EventModalProps {
    event: GameEvent;
}

const EventModal: React.FC<EventModalProps> = ({ event }) => {
    const { resolveEvent } = useGameStore(state => state.actions);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-2 text-yellow-300">{event.title}</h2>
                <p className="text-slate-300 mb-4">{event.description}</p>
                <div className="space-y-2">
                    {event.choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => resolveEvent(index)}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
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
