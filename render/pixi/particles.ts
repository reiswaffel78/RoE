// render/pixi/particles.ts

// Replaced modular imports with a single namespace import for better CDN compatibility.
import * as PIXI from 'pixi.js';
import { AwarenessLevel, Weather } from '../../types';

// Updated the Particle type to use the PIXI namespace.
type Particle = PIXI.Graphics & {
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
};

export class ParticleSystem {
    // Updated types to use the PIXI namespace.
    private app: PIXI.Application;
    private container: PIXI.Container;
    private particles: Particle[] = [];
    private tickerCallback: (ticker: PIXI.Ticker) => void;
    private currentEffect: string = 'none';

    constructor(app: PIXI.Application) {
        this.app = app;
        this.container = new PIXI.Container();
        this.app.stage.addChild(this.container);

        this.tickerCallback = (ticker: PIXI.Ticker) => this.update(ticker.deltaMS / 1000);
        this.app.ticker.add(this.tickerCallback);
    }

    public destroy() {
        this.app.ticker.remove(this.tickerCallback);
        this.container.destroy({ children: true });
    }
    
    public setVisible(visible: boolean) {
        this.container.visible = visible;
    }

    public setEffect(awareness: AwarenessLevel, weather: Weather) {
        const newEffect = `${awareness}-${weather}`;
        if (newEffect === this.currentEffect) return;
        
        this.currentEffect = newEffect;
        this.particles.forEach(p => p.destroy());
        this.particles = [];

        if (awareness === 'ethereal') {
            this.createAurora(50);
        } else if (awareness === 'physical') {
            this.createPollen(100);
        }
    }

    private createPollen(count: number) {
        for (let i = 0; i < count; i++) {
            const p = new PIXI.Graphics() as Particle;
            p.circle(0, 0, Math.random() * 1.5 + 0.5);
            p.fill({ color: 0xffff00, alpha: Math.random() * 0.5 + 0.3 });
            p.x = Math.random() * this.app.screen.width;
            p.y = Math.random() * this.app.screen.height;
            p.vx = (Math.random() - 0.5) * 10;
            p.vy = (Math.random() - 0.5) * 10;
            p.life = p.maxLife = Math.random() * 5 + 2;
            this.particles.push(p);
            this.container.addChild(p);
        }
    }
    
    private createAurora(count: number) {
        for (let i = 0; i < count; i++) {
            const p = new PIXI.Graphics() as Particle;
            p.circle(0, 0, Math.random() * 30 + 10)
            p.fill({ color: [0x8a2be2, 0x00ff7f, 0x40e0d0][i % 3], alpha: Math.random() * 0.2 + 0.1 });
            p.x = Math.random() * this.app.screen.width;
            p.y = Math.random() * this.app.screen.height;
            p.vx = (Math.random() - 0.5) * 20;
            p.vy = (Math.random() - 0.5) * 5;
            p.life = p.maxLife = Math.random() * 8 + 4;
            this.particles.push(p);
            this.container.addChild(p);
        }
    }

    private update(delta: number) {
        if (!this.container.visible) return;

        for (const p of this.particles) {
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.life -= delta;

            p.alpha = (p.life / p.maxLife) * 0.7;

            if (p.life <= 0) {
                 p.x = Math.random() * this.app.screen.width;
                 p.y = this.app.screen.height + 20;
                 p.life = p.maxLife;
            } else if (p.x < -20) {
                p.x = this.app.screen.width + 20;
            } else if (p.x > this.app.screen.width + 20) {
                p.x = -20;
            }
        }
    }
}