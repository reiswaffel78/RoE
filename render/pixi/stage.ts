// render/pixi/stage.ts
import * as PIXI from 'pixi.js';
import { createParticleEmitter } from './particles';

export const initPixi = (container: HTMLElement): PIXI.Application => {
    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x020617, // slate-950
        resizeTo: window,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
    });

    container.appendChild(app.view as HTMLCanvasElement);

    createParticleEmitter(app.stage);
    
    return app;
};

export const cleanupPixi = (app: PIXI.Application) => {
    // FIX: Removed `baseTexture: true` as it was causing a type error in the user's environment.
    // The other options should handle most of the cleanup.
    app.destroy(true, { children: true, texture: true });
};
