import * as React from 'react';
import { StateStorage } from 'zustand/middleware';
import { useGameStore } from '../store/gameStore';
import { GameState } from '../types';

// Throttle function to limit how often a function can be called
const throttle = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return ((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    }) as T;
};

// Custom storage object with throttled setItem
export const throttledLocalStorage: StateStorage = {
    getItem: (name) => {
        return localStorage.getItem(name);
    },
    setItem: throttle((name, value) => {
        try {
            localStorage.setItem(name, value);
        } catch (e) {
            console.error("Failed to save to localStorage", e);
        }
    }, 500),
    removeItem: (name) => {
        localStorage.removeItem(name);
    },
};

// --- Export/Import Logic ---

export const exportGameData = () => {
    try {
        const state = useGameStore.getState();
        const dataStr = JSON.stringify(state);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
        link.download = `roots-of-the-earth-save_${timestamp}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        state.addLog("Game data exported.");
    } catch (error) {
        console.error("Failed to export game data:", error);
        useGameStore.getState().addLog("Error exporting game data.");
    }
};

export const importGameData = (
    event: React.ChangeEvent<HTMLInputElement>,
    importState: (newState: Partial<GameState>) => void
) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const newState = JSON.parse(result) as GameState;
                importState(newState);
            }
        } catch (error) {
            console.error("Failed to parse save file:", error);
            useGameStore.getState().addLog("Error reading save file.");
        } finally {
            // Reset file input to allow importing the same file again
            event.target.value = '';
        }
    };
    reader.readAsText(file);
};