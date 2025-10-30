// hooks/useGameLoop.ts
import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: () => void, interval: number) => {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const tick = () => {
            callbackRef.current();
        };

        const id = setInterval(tick, interval);
        return () => clearInterval(id);
    }, [interval]);
};
