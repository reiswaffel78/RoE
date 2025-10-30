// hooks/useSfx.ts
import { useCallback } from 'react';
import { audioService } from '../services/audio';

export const useSfx = () => {
    const playClick = useCallback(() => {
        audioService.playSfx('click');
    }, []);

    // Add other sound effects here
    // const playPurchase = useCallback(() => { ... }, []);

    return { playClick };
};
