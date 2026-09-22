// Parallax silhouette layers. Shapes are drawn once in white and coloured per
// frame through `tint`, so palette transitions cost nothing.

import { Container, Graphics } from 'pixi.js';
import type { ZoneGrade } from './palette';
import { fbm1D, makeNoise1D, mulberry, ridged1D } from './procedural';

export interface LayerSpec {
    /** baseline as share of viewport height */
    base: number;
    amplitude: number;
    frequency: number;
    depth: number;
    trees: 'none' | 'pines' | 'round' | 'mixed';
    treeDensity: number;
    treeScale: number;
    ridged: boolean;
}

const TERRAIN: Record<ZoneGrade['terrain'], LayerSpec[]> = {
    rolling: [
        { base: 0.6, amplitude: 0.14, frequency: 1.4, depth: 0.15, trees: 'none', treeDensity: 0, treeScale: 0, ridged: false },
        { base: 0.68, amplitude: 0.08, frequency: 2.2, depth: 0.35, trees: 'round', treeDensity: 0.5, treeScale: 0.05, ridged: false },
        { base: 0.77, amplitude: 0.05, frequency: 3.2, depth: 0.6, trees: 'mixed', treeDensity: 0.35, treeScale: 0.09, ridged: false },
    ],
    hills: [
        { base: 0.62, amplitude: 0.08, frequency: 1.1, depth: 0.15, trees: 'none', treeDensity: 0, treeScale: 0, ridged: false },
        { base: 0.69, amplitude: 0.06, frequency: 1.8, depth: 0.35, trees: 'round', treeDensity: 0.18, treeScale: 0.045, ridged: false },
        { base: 0.78, amplitude: 0.035, frequency: 2.4, depth: 0.6, trees: 'round', treeDensity: 0.12, treeScale: 0.08, ridged: false },
    ],
    hollow: [
        { base: 0.58, amplitude: 0.16, frequency: 1.6, depth: 0.15, trees: 'pines', treeDensity: 0.3, treeScale: 0.035, ridged: false },
        { base: 0.67, amplitude: 0.1, frequency: 2.6, depth: 0.35, trees: 'pines', treeDensity: 0.8, treeScale: 0.06, ridged: false },
        { base: 0.77, amplitude: 0.05, frequency: 3.4, depth: 0.6, trees: 'pines', treeDensity: 0.5, treeScale: 0.11, ridged: false },
    ],
    peaks: [
        { base: 0.6, amplitude: 0.3, frequency: 1.3, depth: 0.12, trees: 'none', treeDensity: 0, treeScale: 0, ridged: true },
        { base: 0.68, amplitude: 0.14, frequency: 2.0, depth: 0.32, trees: 'pines', treeDensity: 0.4, treeScale: 0.045, ridged: true },
        { base: 0.78, amplitude: 0.05, frequency: 3.0, depth: 0.6, trees: 'pines', treeDensity: 0.4, treeScale: 0.09, ridged: false },
    ],
};

const drawPine = (g: Graphics, x: number, y: number, h: number) => {
    const w = h * 0.36;
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
        const ty = y - h * (0.18 + i * 0.26);
        const tw = w * (1 - i * 0.24);
        g.moveTo(x - tw, ty + h * 0.2)
            .lineTo(x, ty - h * 0.34)
            .lineTo(x + tw, ty + h * 0.2)
            .closePath();
    }
    g.rect(x - h * 0.03, y - h * 0.2, h * 0.06, h * 0.22);
};

const drawRound = (g: Graphics, x: number, y: number, h: number, rand: () => number) => {
    g.rect(x - h * 0.035, y - h * 0.45, h * 0.07, h * 0.46);
    const r = h * 0.28;
    g.circle(x, y - h * 0.62, r);
    g.circle(x - r * 0.7, y - h * 0.5, r * (0.7 + rand() * 0.2));
    g.circle(x + r * 0.7, y - h * 0.52, r * (0.7 + rand() * 0.2));
    g.circle(x + r * 0.1, y - h * 0.82, r * 0.7);
};

export class LandscapeLayer {
    readonly view = new Graphics();
    constructor(readonly spec: LayerSpec, private readonly seed: number) {}

    draw(width: number, height: number, top: number) {
        const g = this.view;
        g.clear();
        const noise = makeNoise1D(this.seed);
        const rand = mulberry(this.seed * 7 + 3);
        const margin = width * 0.12;
        const steps = Math.ceil((width + margin * 2) / 6);
        const points: number[] = [];
        const heightAt = (x: number) => {
            const nx = (x / width) * this.spec.frequency;
            const n = this.spec.ridged ? ridged1D(noise, nx, 5) : fbm1D(noise, nx, 5);
            return top + height * (this.spec.base - this.spec.amplitude * (n - 0.35));
        };
        for (let i = 0; i <= steps; i++) {
            const x = -margin + (i / steps) * (width + margin * 2);
            points.push(x, heightAt(x));
        }
        points.push(width + margin, top + height * 1.2, -margin, top + height * 1.2);
        g.poly(points).fill({ color: 0xffffff });

        if (this.spec.trees !== 'none') {
            const count = Math.floor((width / 20) * this.spec.treeDensity);
            for (let i = 0; i < count; i++) {
                const x = -margin + rand() * (width + margin * 2);
                const y = heightAt(x) + 2;
                const h = height * this.spec.treeScale * (0.6 + rand() * 0.7);
                const kind = this.spec.trees === 'mixed' ? (rand() > 0.5 ? 'pines' : 'round') : this.spec.trees;
                if (kind === 'pines') drawPine(g, x, y, h);
                else drawRound(g, x, y, h, rand);
            }
            g.fill({ color: 0xffffff });
        }
    }
}

export class Landscape {
    readonly view = new Container();
    layers: LandscapeLayer[] = [];

    build(terrain: ZoneGrade['terrain'], seed: number) {
        // Only destroy our own ridge layers; fog and mist sprites are shared.
        this.layers.forEach((l) => l.view.destroy());
        this.view.removeChildren();
        this.layers = TERRAIN[terrain].map((spec, i) => new LandscapeLayer(spec, seed * 13 + i * 101));
        this.layers.forEach((l) => this.view.addChild(l.view));
    }
}
