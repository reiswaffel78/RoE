// components/SpiritDialog.tsx
import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateSpiritMessage } from '../services/ai/gemini';
import { useDynamicText } from '../hooks/useDynamicText';
import { formatNumber } from '../utils/format';
import type { Plant } from '../types';

const SpiritDialog: React.FC = () => {
    const gameState = useGameStore(state => ({ chi: state.chi, balance: state.balance, plants: state.plants }));
    const { text, isLoading, generateText } = useDynamicText(generateSpiritMessage);

    useEffect(() => {
        const timer = setTimeout(() => {
            // FIX: Add explicit type for `p` to resolve properties on `unknown` type error.
            const summary = `Chi: ${formatNumber(gameState.chi)}, Balance: ${gameState.balance.toFixed(1)}%. Player has ${Object.values(gameState.plants).filter((p: Plant) => p.level > 0).length} types of plants.`;
            generateText(summary);
        }, 30000); // Generate a new message every 30 seconds

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.chi, generateText]);
    
    useEffect(() => {
        // Initial message
        generateText("The garden is quiet.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2 text-slate-200">Spirit's Whisper</h2>
            <p className="text-slate-400 italic">
                {isLoading ? "The air shimmers..." : text || "The garden is silent."}
            </p>
        </div>
    );
};

export default SpiritDialog;
