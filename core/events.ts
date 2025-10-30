// core/events.ts
import { GameEvent } from '../types';

export const gameEvents: GameEvent[] = [
    {
        id: 'e1',
        title: 'A Wandering Sprite',
        description: 'A tiny, shimmering sprite flits into your garden, drawn by the growing energy. It offers a gift.',
        trigger: (state) => state.totalChi > 500 && !state.log.some(l => l.includes('sprite')),
        choices: [
            {
                text: 'Accept its gift of Chi.',
                effect: (state) => {
                    const chiGain = state.chi * 0.25; // 25% of current Chi
                    return {
                        chi: state.chi + chiGain,
                        log: [...state.log, `The sprite gifts you a burst of energy!`],
                    };
                },
            },
            {
                text: 'Ask for its wisdom.',
                effect: (state) => ({
                    balance: state.balance < 50 ? Math.max(0, state.balance - 10) : Math.min(100, state.balance + 10),
                    log: [...state.log, `The sprite's wisdom subtly shifts the garden's balance.`],
                }),
            },
        ],
    },
];
