// Pooled sprite particles. Behaviours are small update functions so each
// effect (fireflies, rain, bursts, homing orbs …) stays readable.

import { Container, Sprite, type Texture } from 'pixi.js';

export interface Particle {
    sprite: Sprite;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    alpha: number;
    spin: number;
    phase: number;
    /** homing target */
    tx: number;
    ty: number;
    behaviour: Behaviour;
    onDone?: () => void;
}

export type Behaviour = (p: Particle, dt: number, time: number) => void;

export class ParticleLayer {
    readonly view = new Container();
    private active: Particle[] = [];
    private pool: Sprite[] = [];

    constructor(private readonly max: number) {}

    get count() {
        return this.active.length;
    }

    spawn(
        texture: Texture,
        init: Partial<Omit<Particle, 'sprite'>> & { behaviour: Behaviour },
        tint = 0xffffff,
        blend: 'add' | 'normal' = 'add',
    ): Particle | null {
        if (this.active.length >= this.max) return null;
        const sprite = this.pool.pop() ?? new Sprite();
        sprite.texture = texture;
        sprite.anchor.set(0.5);
        sprite.tint = tint;
        sprite.blendMode = blend;
        sprite.visible = true;
        const p: Particle = {
            sprite,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 1,
            size: 1,
            alpha: 1,
            spin: 0,
            phase: Math.random() * Math.PI * 2,
            tx: 0,
            ty: 0,
            ...init,
        };
        this.view.addChild(sprite);
        this.active.push(p);
        this.apply(p);
        return p;
    }

    private apply(p: Particle) {
        p.sprite.position.set(p.x, p.y);
    }

    update(dt: number, time: number) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            p.life += dt;
            p.behaviour(p, dt, time);
            if (p.life >= p.maxLife) {
                this.active.splice(i, 1);
                p.sprite.visible = false;
                this.view.removeChild(p.sprite);
                this.pool.push(p.sprite);
                p.onDone?.();
                continue;
            }
            this.apply(p);
        }
    }

    clear() {
        for (const p of this.active) {
            p.sprite.visible = false;
            this.view.removeChild(p.sprite);
            this.pool.push(p.sprite);
        }
        this.active = [];
    }
}

const fadeInOut = (p: Particle, edge = 0.2) => {
    const t = p.life / p.maxLife;
    return Math.min(1, t / edge, (1 - t) / edge);
};

export const behaviours = {
    firefly: ((p, dt, time) => {
        p.vx += Math.sin(time * 0.7 + p.phase) * 6 * dt;
        p.vy += Math.cos(time * 0.9 + p.phase * 1.3) * 5 * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + p.phase * 3);
        p.sprite.alpha = p.alpha * fadeInOut(p) * (0.25 + 0.75 * pulse);
        p.sprite.scale.set(p.size * (0.8 + 0.3 * pulse));
    }) as Behaviour,

    mote: ((p, dt, time) => {
        p.x += (p.vx + Math.sin(time * 0.5 + p.phase) * 6) * dt;
        p.y += p.vy * dt;
        p.sprite.alpha = p.alpha * fadeInOut(p, 0.3);
        p.sprite.scale.set(p.size);
    }) as Behaviour,

    rain: ((p, dt) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.sprite.alpha = p.alpha;
        p.sprite.rotation = Math.atan2(p.vy, p.vx) - Math.PI / 2;
        p.sprite.scale.set(p.size * 0.5, p.size);
        if (p.y > p.ty) p.life = p.maxLife;
    }) as Behaviour,

    leaf: ((p, dt, time) => {
        p.x += (p.vx + Math.sin(time * 1.3 + p.phase) * 18) * dt;
        p.y += p.vy * dt;
        p.sprite.rotation += p.spin * dt;
        p.sprite.scale.set(p.size, p.size * (0.6 + 0.4 * Math.sin(time * 3 + p.phase)));
        p.sprite.alpha = p.alpha * fadeInOut(p, 0.15);
    }) as Behaviour,

    burst: ((p, dt) => {
        p.vx *= 1 - 2.6 * dt;
        p.vy = p.vy * (1 - 2.6 * dt) - 12 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const t = p.life / p.maxLife;
        p.sprite.alpha = p.alpha * (1 - t * t);
        p.sprite.scale.set(p.size * (1 - t * 0.6));
    }) as Behaviour,

    /** Curves towards (tx, ty) — used for chi flying into the HUD. */
    homing: ((p, dt) => {
        const t = Math.min(1, p.life / p.maxLife);
        const ease = t * t * (3 - 2 * t);
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * 9 * dt * ease;
        p.vy += dy * 9 * dt * ease;
        p.vx *= 1 - 3.5 * dt;
        p.vy *= 1 - 3.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.sprite.alpha = p.alpha * Math.min(1, (1 - t) * 4);
        p.sprite.scale.set(p.size * (1 - t * 0.5));
        if (Math.hypot(dx, dy) < 12 && t > 0.3) p.life = p.maxLife;
    }) as Behaviour,

    ring: ((p) => {
        const t = p.life / p.maxLife;
        const e = 1 - Math.pow(1 - t, 3);
        p.sprite.scale.set(p.size * (0.2 + e));
        p.sprite.alpha = p.alpha * (1 - t);
    }) as Behaviour,

    rise: ((p, dt, time) => {
        p.x += Math.sin(time * 2 + p.phase) * 10 * dt;
        p.y += p.vy * dt;
        p.sprite.alpha = p.alpha * fadeInOut(p, 0.25);
        p.sprite.scale.set(p.size);
    }) as Behaviour,
};
