// render/pixi/stage.ts
import { Application } from 'pixi.js';
import { createParticleEmitter } from './particles';
import { getFlag } from '../../utils/flags';
import { markBootStepError, markBootStepSuccess, recordBootWarning } from '../../utils/bootDiagnostics';

const cleanupRegistry = new WeakMap<Application, () => void>();

export const initPixi = (container: HTMLElement): Application | null => {
    if (getFlag('noPixi')) {
        return null;
    }

    try {
        const app = new Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundAlpha: 0,
            clearBeforeRender: false,
            resizeTo: window,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            antialias: true,
        });

        const canvas = app.view as HTMLCanvasElement;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';

        container.appendChild(canvas);

        try {
            createParticleEmitter(app.stage);
        } catch (particleError) {
            recordBootWarning('Pixi particles disabled');
            console.warn('Failed to initialise Pixi particles', particleError);
        }

        const handleResize = () => {
            const targetWidth = container.clientWidth || window.innerWidth;
            const targetHeight = container.clientHeight || window.innerHeight;
            app.renderer.resize(targetWidth, targetHeight);
        };

        const handleContextLost = (event: Event) => {
            event.preventDefault();
            recordBootWarning('Pixi WebGL context lost');
        };

        const handleContextRestored = () => {
            try {
                app.stage.removeChildren();
                createParticleEmitter(app.stage);
                markBootStepSuccess('E', 'Pixi context restored');
            } catch (error) {
                recordBootWarning('Pixi context restore failed');
                console.error('Failed to restore Pixi stage', error);
            }
        };

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('webglcontextlost', handleContextLost, false);
        canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

        cleanupRegistry.set(app, () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('webglcontextlost', handleContextLost, false);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
        });

        return app;
    } catch (error) {
        markBootStepError('E', 'Pixi initialisation failed');
        console.error('Failed to initialise Pixi stage', error);
        throw error;
    }
};

export const cleanupPixi = (app: Application | null) => {
    if (!app) {
        return;
    }
    cleanupRegistry.get(app)?.();
    app.destroy(true, { children: true, texture: true });
};
