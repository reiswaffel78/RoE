// components/PixiBackground.tsx

import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { ParticleSystem } from '../render/pixi/particles';
import { logger } from '../services/logger';
import { GameState } from '../types';

const PixiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            logger.warn("PixiBackground: Canvas ref not available on mount.");
            return;
        }

        // Use a ref-like object to hold the app instance, managing it across async operations and cleanup.
        const appRef: { current: PIXI.Application | null } = { current: new PIXI.Application() };
        let unsubscribe: (() => void) | null = null;
        
        // Asynchronous initialization function for clarity and proper error handling.
        const initializePixi = async () => {
            try {
                // This check handles cases where cleanup runs before init completes.
                if (!appRef.current) return;

                await appRef.current.init({
                    canvas,
                    resizeTo: window,
                    backgroundAlpha: 0,
                    antialias: true,
                });

                // If cleanup has run during the await, the ref will be null.
                if (!appRef.current) return;
                
                const particleSystem = new ParticleSystem(appRef.current);
                const updateParticles = (state: GameState) => {
                    particleSystem.setVisible(!state.settings.lowSpecMode);
                    particleSystem.setEffect(state.awareness, state.weather);
                };
                
                // Final check before subscribing to the store.
                if (appRef.current) {
                     unsubscribe = useGameStore.subscribe(updateParticles);
                     updateParticles(useGameStore.getState());
                     logger.info("Pixi.js application initialized successfully.");
                }
            } catch (err) {
                logger.error("Pixi.js application failed to initialize.", { error: err });
                // Let the cleanup function handle the destruction of a partially initialized app.
            }
        };

        initializePixi();

        return () => {
            logger.info("PixiBackground: Cleanup initiated.");
            if (unsubscribe) {
                unsubscribe();
            }

            const appToDestroy = appRef.current;
            if (appToDestroy) {
                // Nullify the ref immediately to prevent async callbacks from using a destroyed app.
                appRef.current = null;
                
                // The critical fix: Only destroy if the renderer has been created.
                // This prevents the race condition crash in React Strict Mode.
                if (appToDestroy.renderer) {
                    appToDestroy.destroy(true, { children: true, texture: true });
                    logger.info("Pixi.js application destroyed.");
                } else {
                    logger.warn("Pixi.js cleanup: Skipped destroy() because renderer was not initialized.");
                }
            }
        };
    }, []);

    return <canvas ref={canvasRef} id="pixi-canvas" />;
};

export default PixiBackground;