// hooks/useGameLoop.ts
import { useEffect, useRef } from 'react';

const clampDelta = (deltaSeconds: number): number => {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
        return 0;
    }
    return Math.min(deltaSeconds, 1);
};

interface GameLoopOptions {
    enabled?: boolean;
}

export const useGameLoop = (
    callback: (deltaSeconds: number) => void,
    interval: number,
    options?: GameLoopOptions,
) => {
    const callbackRef = useRef(callback);
    const timerIdRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const enabled = options?.enabled ?? true;

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (!Number.isFinite(interval) || interval <= 0) {
            console.warn('useGameLoop received invalid interval', interval);
            return;
        }

        lastTimestampRef.current = Date.now();

        const tick = () => {
             const now = Date.now();
            const last = lastTimestampRef.current ?? now;
            lastTimestampRef.current = now;

            const deltaSeconds = clampDelta((now - last) / 1000);
            if (deltaSeconds === 0) {
                return;
            }

            try {
                callbackRef.current(deltaSeconds);
            } catch (error) {
                console.error('Game loop tick failed', error);
            }
        };

        timerIdRef.current = window.setInterval(tick, interval);

        return () => {
            if (timerIdRef.current !== null) {
                window.clearInterval(timerIdRef.current);
                timerIdRef.current = null;
            }
            lastTimestampRef.current = null;
        };
    }, [enabled, interval]);
};
