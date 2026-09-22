// Garden spirit whispers: contextual local templates, optionally Gemini
// (only with a key the player enters themselves; nothing is bundled).

import type { TFunction } from 'i18next';
import { computeRates, getDayInfo, type GameState } from '../core';

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const localWhisper = (t: TFunction, game: GameState): string => {
    const rates = computeRates(game);
    const day = getDayInfo(game.worldTime);
    const pools: string[][] = [];
    const list = (key: string) => t(`whispers.${key}`, { returnObjects: true }) as string[];
    if (game.weather.kind === 'aurora') pools.push(list('aurora'));
    if (game.weather.kind === 'rain') pools.push(list('rain'));
    if (rates.harmony >= 0.9) pools.push(list('harmony'));
    if (game.balance < 35) pools.push(list('physical'), list('physical'));
    if (game.balance > 65) pools.push(list('ethereal'), list('ethereal'));
    if (day.night) pools.push(list('night'));
    pools.push(list('generic'));
    // The zone's own saying.
    pools.push([t(`zones.${game.zone}.quote`)]);
    return pick(pick(pools));
};

export const geminiWhisper = async (key: string, game: GameState, language: string): Promise<string | null> => {
    const rates = computeRates(game);
    const day = getDayInfo(game.worldTime);
    const summary = `balance ${Math.round(game.balance)}/100 (0 earth, 100 dream), harmony ${rates.harmony.toFixed(2)}, ${
        day.night ? 'night' : 'day'
    }, weather ${game.weather.kind}, zone ${game.zone}`;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: `You are the ancient, gentle spirit of a garden. Reply with one short poetic sentence (max 18 words) in ${
                                    language === 'de' ? 'German' : 'English'
                                }. No quotes, no emojis.`,
                            },
                        ],
                    },
                    contents: [{ parts: [{ text: `The garden right now: ${summary}.` }] }],
                }),
            },
        );
        if (!response.ok) return null;
        const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return text && text.length < 220 ? text : null;
    } catch {
        return null;
    } finally {
        window.clearTimeout(timeout);
    }
};
