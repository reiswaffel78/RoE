// render/pixi/stage.ts
import * as PIXI from 'pixi.js';
import { GameState } from '../../types';
import { ParticleSystem } from './particles';
import { logger } from '../../services/logger';

class PixiStage {
    private app: PIXI.Application | null = null;
    private particleSystem: ParticleSystem | null = null;
    private initialized = false;
    private initializing = false;

    public init(canvas: HTMLCanvasElement): void {
        if (this.initialized || this.initializing) {
            logger.warn("PixiStage.init: Already initialized or initialization in progress.");
            return;
        }
        
        this.initializing = true;
        this.app = new PIXI.Application();
        
        this.app.init({
            canvas: canvas,
            resizeTo: window,
            backgroundAlpha: 0,
            antialias: true,
        }).then(() => {
            if (!this.app) {
                this.initializing = false;
                return;
            } 
            
            logger.info("Pixi.js application initialized successfully.");
            this.particleSystem = new ParticleSystem(this.app);
            
            this.update(null);
            this.initialized = true;
            this.initializing = false;

        }).catch(err => {
             logger.error("Pixi.js application failed to initialize.", { error: err });
             this.initializing = false;
             // Do not destroy here; the component's cleanup function is responsible for that.
             // This prevents a secondary crash when init fails because the canvas was removed.
             this.app = null;
        });
    }

    public update(state: GameState | null): void {
        if (!this.initialized || !this.app || !this.particleSystem) {
            return;
        }

        if (state) {
            this.particleSystem.setVisible(!state.settings.lowSpecMode);
            this.particleSystem.setEffect(state.awareness, state.weather);
        } else {
            this.particleSystem.setVisible(true);
            this.particleSystem.setEffect('physical', 'clear');
        }
    }

    public destroy(): void {
        logger.info("Destroying PixiStage.");
        
        if (this.particleSystem) {
            this.particleSystem.destroy();
            this.particleSystem = null;
        }
        
        if (this.app) {
            // Safely destroy the application only if it was fully initialized (renderer exists).
            // This prevents the "cannot access property 'destroy' of undefined renderer" error.
            if (this.app.renderer) {
                // FIX: Removed `baseTexture: true` from destroy options to resolve TypeScript error. This property is not recognized in the project's Pixi.js type definitions.
                this.app.destroy(true, { children: true, texture: true });
            }
            this.app = null;
        }

        this.initialized = false;
        this.initializing = false;
    }
}

export const pixiStage = new PixiStage();