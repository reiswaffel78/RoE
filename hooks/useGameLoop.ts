// hooks/useGameLoop.ts
import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: (deltaSeconds: number) => void, interval: number) => {
    const callbackRef = useRef(callback);
        const lastTimestampRef = useRef<number | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        lastTimestampRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();

        const tick = () => {
                       const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const last = lastTimestampRef.current ?? now;
            const deltaSeconds = Math.max(0, (now - last) / 1000);
            lastTimestampRef.current = now;
            callbackRef.current(deltaSeconds);
        };

        const id = window.setInterval(tick, interval);
        return () => window.clearInterval(id);
    }, [interval]);
};
