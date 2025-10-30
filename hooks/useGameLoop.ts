import { useEffect, useRef } from 'react';
import { logger } from '../services/logger';

export const useGameLoop = (callback: () => void, interval: number) => {
  // FIX: Initialize useRef with null to fix "Expected 1 arguments, but got 0" error.
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    logger.debug("useGameLoop: Setting up interval.", { interval });
    function tick() {
      if (savedCallback.current) {
        try {
            savedCallback.current();
        } catch (error) {
            logger.error("useGameLoop: Error caught inside game tick callback.", { error });
        }
      }
    }
    const id = setInterval(tick, interval);
    return () => {
        logger.debug("useGameLoop: Clearing interval.", { interval });
        clearInterval(id);
    };
  }, [interval]);
};
