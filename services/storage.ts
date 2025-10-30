// services/storage.ts
import { GameState } from '../types';
import { gameVersion } from '../core/data';

const SAVE_KEY = 'zen-garden-save';

export const exportGameData = () => {
    const stateString = localStorage.getItem(SAVE_KEY);
    if (!stateString) {
        alert("No game data found to export.");
        return;
    }
    const blob = new Blob([stateString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zen-garden-save-${gameVersion}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


export const importGameData = (event: React.ChangeEvent<HTMLInputElement>, importState: (newState: GameState) => void) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result === 'string') {
                const newState = JSON.parse(result) as GameState;
                // Basic validation
                if (newState.chi !== undefined && newState.plants !== undefined) {
                    if (window.confirm("Are you sure you want to import this save? Your current progress will be overwritten.")) {
                        importState(newState);
                        alert("Game data imported successfully!");
                    }
                } else {
                    throw new Error("Invalid save file format.");
                }
            }
        } catch (error) {
            console.error("Failed to import game data:", error);
            alert(`Error importing file: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    reader.readAsText(file);
    // Clear the input value to allow importing the same file again
    event.target.value = '';
};
