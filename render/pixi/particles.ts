// render/pixi/particles.ts
import * as PIXI from 'pixi.js';
import { Emitter, upgradeConfig } from '@pixi/particle-emitter';
import { logger } from '../../services/logger';


// A simple particle texture
const createParticleTexture = (app: PIXI.Application) => {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x99f6e4); // emerald-200
    graphics.drawCircle(0, 0, 4);
    graphics.endFill();
    return app.renderer.generateTexture(graphics);
};

export const createParticleEmitter = (stage: PIXI.Container) => {
    if (!(stage.parent instanceof PIXI.Application)) {
        logger.warn("Could not create particle emitter: stage has no parent application.");
        return;
    }
    const app = stage.parent;
    const particleTexture = createParticleTexture(app);

    const emitter = new Emitter(
        stage,
        upgradeConfig({
            "alpha": {
                "start": 0.6,
                "end": 0
            },
            "scale": {
                "start": 0.2,
                "end": 0.5,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#a7f3d0",
                "end": "#34d399"
            },
            "speed": {
                "start": 50,
                "end": 10,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": -20
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 0,
                "max": 360
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 4,
                "max": 8
            },
            "blendMode": "normal",
            "frequency": 0.05,
            "emitterLifetime": -1,
            "maxParticles": 50,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": false,
            "spawnType": "rect",
            "spawnRect": {
                "x": 0,
                "y": window.innerHeight,
                "w": window.innerWidth,
                "h": 10
            }
        }, [particleTexture])
    );
    
    let elapsed = Date.now();

    const update = () => {
        const now = Date.now();
        emitter.update((now - elapsed) * 0.001);
        elapsed = now;
    };
    
    emitter.emit = true;
    app.ticker.add(update);
    
    return emitter;
};
