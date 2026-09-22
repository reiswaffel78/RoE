// Zone compositions for the flat-illustration landscape. Every layer is drawn
// once in white and coloured per frame (tint) from the zone palette, so time
// of day, weather and zone transitions cost nothing at runtime.

import { Container, Graphics } from 'pixi.js';
import type { ZoneId } from '../../core';
import { fbm1D, makeNoise1D, mulberry, ridged1D } from './procedural';

export type LayerRole = 'land' | 'frame' | 'water' | 'shimmer' | 'accent' | 'waterfall' | 'glow';

export interface DrawCtx {
    /** full screen width */
    width: number;
    /** composition viewport */
    vx: number;
    vy: number;
    vw: number;
    vh: number;
}

export interface TerrainLayer {
    view: Graphics;
    role: LayerRole;
    /** atmospheric depth: 0 = horizon … 1 = foreground (frame > 1 = darker than deep) */
    depth: number;
    /** horizontal parallax factor */
    parallax: number;
    /** baseline (share of viewport height) that receives a haze band, or null */
    fogAt: number | null;
    /** idle animation */
    anim?: 'bob' | 'shimmer' | 'flow';
    phase: number;
    draw: (g: Graphics, c: DrawCtx) => void;
}

// ------------------------------------------------------------------ primitives

const ridge = (
    g: Graphics,
    c: DrawCtx,
    seed: number,
    base: number,
    amp: number,
    freq: number,
    opts: { sharp?: boolean; octaves?: number } = {},
) => {
    const noise = makeNoise1D(seed);
    const margin = c.width * 0.15;
    const steps = Math.ceil((c.width + margin * 2) / 8);
    const pts: number[] = [];
    const heightAt = (x: number) => {
        const nx = (x / c.vw) * freq;
        const n = opts.sharp ? ridged1D(noise, nx, opts.octaves ?? 4) : fbm1D(noise, nx, opts.octaves ?? 3);
        return c.vy + c.vh * (base - amp * (n - 0.3));
    };
    for (let i = 0; i <= steps; i++) {
        const x = -margin + (i / steps) * (c.width + margin * 2);
        pts.push(x, heightAt(x));
    }
    pts.push(c.width + margin, c.vy + c.vh * 1.6, -margin, c.vy + c.vh * 1.6);
    g.poly(pts).fill(0xffffff);
    return heightAt;
};

/** Slender tree with an elongated oval crown (the grove's signature tree). */
const tallTree = (g: Graphics, x: number, ground: number, h: number) => {
    const trunkW = Math.max(1.5, h * 0.035);
    g.rect(x - trunkW / 2, ground - h * 0.55, trunkW, h * 0.56).fill(0xffffff);
    g.ellipse(x, ground - h * 0.68, h * 0.16, h * 0.34).fill(0xffffff);
};

const roundTree = (g: Graphics, x: number, ground: number, h: number) => {
    const trunkW = Math.max(1.2, h * 0.06);
    g.rect(x - trunkW / 2, ground - h * 0.5, trunkW, h * 0.51).fill(0xffffff);
    g.circle(x, ground - h * 0.66, h * 0.3).fill(0xffffff);
    g.circle(x - h * 0.2, ground - h * 0.52, h * 0.2).fill(0xffffff);
    g.circle(x + h * 0.2, ground - h * 0.55, h * 0.21).fill(0xffffff);
};

const pine = (g: Graphics, x: number, ground: number, h: number) => {
    const w = h * 0.32;
    g.rect(x - h * 0.025, ground - h * 0.15, h * 0.05, h * 0.16).fill(0xffffff);
    for (let i = 0; i < 4; i++) {
        const top = ground - h * (0.3 + i * 0.22);
        const tw = w * (1 - i * 0.2);
        g.poly([x - tw, top + h * 0.26, x, top - h * 0.14, x + tw, top + h * 0.26]).fill(0xffffff);
    }
};

const stone = (g: Graphics, x: number, ground: number, w: number, h: number, tilt = 0) => {
    const t = w * tilt;
    g.poly([
        x - w / 2, ground + 2,
        x - w * 0.46 + t, ground - h * 0.92,
        x - w * 0.2 + t, ground - h,
        x + w * 0.3 + t, ground - h * 0.96,
        x + w * 0.5, ground + 2,
    ]).fill(0xffffff);
};

const mesa = (g: Graphics, x: number, ground: number, w: number, h: number) => {
    g.poly([
        x - w / 2, ground + 2,
        x - w * 0.36, ground - h * 0.86,
        x - w * 0.3, ground - h,
        x + w * 0.28, ground - h,
        x + w * 0.34, ground - h * 0.88,
        x + w / 2, ground + 2,
    ]).fill(0xffffff);
};

const spire = (g: Graphics, x: number, ground: number, w: number, h: number) => {
    g.poly([
        x - w / 2, ground + 2,
        x - w * 0.28, ground - h * 0.55,
        x - w * 0.18, ground - h * 0.92,
        x, ground - h,
        x + w * 0.16, ground - h * 0.9,
        x + w * 0.3, ground - h * 0.5,
        x + w / 2, ground + 2,
    ]).fill(0xffffff);
};

const arch = (g: Graphics, x: number, ground: number, w: number, h: number) => {
    const leg = w * 0.2;
    g.poly([
        x - w / 2, ground + 2,
        x - w * 0.46, ground - h * 0.8,
        x - w * 0.3, ground - h,
        x + w * 0.35, ground - h * 0.98,
        x + w * 0.48, ground - h * 0.7,
        x + w / 2, ground + 2,
        x + w / 2 - leg, ground + 2,
        x + w * 0.22, ground - h * 0.55,
        x, ground - h * 0.68,
        x - w * 0.22, ground - h * 0.55,
        x - w / 2 + leg, ground + 2,
    ]).fill(0xffffff);
};

const cactus = (g: Graphics, x: number, ground: number, h: number) => {
    const w = h * 0.16;
    g.roundRect(x - w / 2, ground - h, w, h + 2, w / 2).fill(0xffffff);
    g.roundRect(x - w * 1.7, ground - h * 0.62, w * 0.75, h * 0.34, w * 0.37).fill(0xffffff);
    g.rect(x - w * 1.35, ground - h * 0.34, w * 1.2, w * 0.6).fill(0xffffff);
    g.roundRect(x + w * 0.95, ground - h * 0.78, w * 0.75, h * 0.38, w * 0.37).fill(0xffffff);
    g.rect(x + w * 0.3, ground - h * 0.46, w * 1.1, w * 0.6).fill(0xffffff);
};

/** Large pointed leaf silhouette from (x, y) along `angle`. */
const bigLeaf = (g: Graphics, x: number, y: number, len: number, width: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const P = (u: number, v: number): [number, number] => [x + u * cos - v * sin, y + u * sin + v * cos];
    const pts: number[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const [px, py] = P(t * len, -Math.sin(t * Math.PI) * width * (1 - t * 0.25));
        pts.push(px, py);
    }
    for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const [px, py] = P(t * len, Math.sin(t * Math.PI) * width * (1 - t * 0.25));
        pts.push(px, py);
    }
    g.poly(pts).fill(0xffffff);
    // Stem.
    const [sx, sy] = P(-len * 0.25, 0);
    g.moveTo(sx, sy).lineTo(x, y).stroke({ width: Math.max(2, width * 0.12), color: 0xffffff, cap: 'round' });
};

const trunk = (g: Graphics, x: number, top: number, bottom: number, w: number, rand: () => number) => {
    g.poly([x - w * 0.5, top, x + w * 0.5, top, x + w * 0.62, bottom, x - w * 0.62, bottom]).fill(0xffffff);
    // A couple of branch stubs reaching out of frame.
    for (let i = 0; i < 2; i++) {
        const y = top + (bottom - top) * (0.15 + rand() * 0.3);
        const dir = rand() > 0.5 ? 1 : -1;
        g.moveTo(x, y)
            .quadraticCurveTo(x + dir * w * 1.4, y - w * 0.8, x + dir * w * 2.8, y - w * 2.2)
            .stroke({ width: w * 0.42, color: 0xffffff, cap: 'round' });
    }
};

const floatingIsland = (g: Graphics, cx: number, cy: number, w: number, h: number, rand: () => number) => {
    // Rocky underside: an irregular, jagged cone.
    const pts: number[] = [cx - w / 2, cy];
    const teeth = 9;
    for (let i = 1; i < teeth; i++) {
        const t = i / teeth;
        const shape = Math.pow(Math.sin(t * Math.PI), 0.8);
        const depth = h * shape * (0.55 + rand() * 0.45) * (i % 2 ? 1 : 0.8);
        pts.push(cx - w / 2 + t * w + (rand() - 0.5) * w * 0.04, cy + depth);
    }
    pts.push(cx + w / 2, cy);
    g.poly(pts).fill(0xffffff);
    // Soft grassy top.
    g.ellipse(cx, cy, w / 2, h * 0.08).fill(0xffffff);
    g.circle(cx - w * 0.2, cy - h * 0.04, h * 0.08).fill(0xffffff);
    g.circle(cx + w * 0.12, cy - h * 0.05, h * 0.1).fill(0xffffff);
};

// ------------------------------------------------------------------ compositions

type Spec = Omit<TerrainLayer, 'view' | 'phase'> & { phase?: number };

const land = (depth: number, parallax: number, fogAt: number | null, draw: Spec['draw'], extra: Partial<Spec> = {}): Spec => ({
    role: 'land',
    depth,
    parallax,
    fogAt,
    draw,
    ...extra,
});

const lake = (top: number, bottom: number): Spec[] => [
    {
        role: 'water',
        depth: 0.45,
        parallax: 0.4,
        fogAt: null,
        draw: (g, c) => g.rect(-c.width * 0.2, c.vy + c.vh * top, c.width * 1.4, c.vh * (bottom - top)).fill(0xffffff),
    },
    {
        role: 'shimmer',
        depth: 0.45,
        parallax: 0.4,
        fogAt: null,
        anim: 'shimmer',
        draw: (g, c) => {
            const rand = mulberry(Math.round(top * 1000));
            for (let i = 0; i < 26; i++) {
                const y = c.vy + c.vh * (top + 0.008 + rand() * (bottom - top - 0.016));
                const x = c.vx + rand() * c.vw;
                const len = c.vw * (0.02 + rand() * 0.07);
                g.rect(x, y, len, Math.max(1, c.vh * 0.0022)).fill(0xffffff);
            }
        },
    },
];

const frameGround = (seed: number, base = 0.8): Spec =>
    land(0.78, 0.7, null, (g, c) => ridge(g, c, seed, base, 0.025, 1.6));

const COMPOSITIONS: Record<ZoneId, () => Spec[]> = {
    grove: () => [
        land(0.12, 0.08, 0.6, (g, c) => {
            const h = ridge(g, c, 11, 0.58, 0.1, 1.2);
            const rand = mulberry(3);
            for (let i = 0; i < 70; i++) {
                const x = -c.width * 0.1 + rand() * c.width * 1.2;
                roundTree(g, x, h(x) + 2, c.vh * (0.025 + rand() * 0.02));
            }
        }),
        land(0.32, 0.18, 0.66, (g, c) => {
            const h = ridge(g, c, 21, 0.655, 0.06, 1.8);
            const rand = mulberry(5);
            for (let i = 0; i < 38; i++) {
                const x = -c.width * 0.1 + rand() * c.width * 1.2;
                tallTree(g, x, h(x) + 3, c.vh * (0.1 + rand() * 0.09));
            }
        }),
        ...lake(0.69, 0.8),
        land(0.58, 0.45, null, (g, c) => {
            stone(g, c.vx + c.vw * 0.2, c.vy + c.vh * 0.745, c.vh * 0.035, c.vh * 0.09, 0.1);
            stone(g, c.vx + c.vw * 0.235, c.vy + c.vh * 0.75, c.vh * 0.025, c.vh * 0.055, -0.1);
            stone(g, c.vx + c.vw * 0.77, c.vy + c.vh * 0.75, c.vh * 0.03, c.vh * 0.075, 0.05);
        }),
        frameGround(31),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                const rand = mulberry(7);
                trunk(g, c.vx + c.vw * 0.035, c.vy - c.vh * 0.1, c.vy + c.vh * 1.1, c.vw * 0.05, rand);
                trunk(g, c.vx + c.vw * 0.975, c.vy - c.vh * 0.1, c.vy + c.vh * 1.1, c.vw * 0.065, rand);
                bigLeaf(g, c.vx - c.vw * 0.02, c.vy + c.vh * 1.02, c.vh * 0.28, c.vh * 0.06, -0.7);
                bigLeaf(g, c.vx + c.vw * 0.04, c.vy + c.vh * 1.03, c.vh * 0.24, c.vh * 0.05, -1.2);
                bigLeaf(g, c.vx + c.vw * 1.02, c.vy + c.vh * 1.02, c.vh * 0.3, c.vh * 0.065, -2.4);
                bigLeaf(g, c.vx + c.vw * 0.96, c.vy + c.vh * 1.04, c.vh * 0.22, c.vh * 0.05, -2.0);
            },
        },
    ],

    desert: () => [
        land(0.1, 0.08, 0.64, (g, c) => {
            ridge(g, c, 12, 0.64, 0.02, 1);
            const rand = mulberry(8);
            for (let i = 0; i < 7; i++) {
                const x = c.vx + rand() * c.vw;
                mesa(g, x, c.vy + c.vh * 0.64, c.vh * (0.12 + rand() * 0.18), c.vh * (0.06 + rand() * 0.08));
            }
        }),
        land(0.3, 0.18, 0.68, (g, c) => {
            ridge(g, c, 22, 0.68, 0.03, 1.4);
            const ground = c.vy + c.vh * 0.68;
            spire(g, c.vx + c.vw * 0.12, ground, c.vh * 0.08, c.vh * 0.32);
            spire(g, c.vx + c.vw * 0.2, ground, c.vh * 0.05, c.vh * 0.18);
            arch(g, c.vx + c.vw * 0.78, ground, c.vh * 0.34, c.vh * 0.38);
            spire(g, c.vx + c.vw * 0.95, ground, c.vh * 0.09, c.vh * 0.44);
        }),
        land(0.52, 0.32, 0.75, (g, c) => ridge(g, c, 32, 0.75, 0.05, 1.3)),
        frameGround(42, 0.81),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                cactus(g, c.vx + c.vw * 0.08, c.vy + c.vh * 1.0, c.vh * 0.3);
                stone(g, c.vx + c.vw * 0.0, c.vy + c.vh * 1.06, c.vh * 0.3, c.vh * 0.16, 0.2);
                stone(g, c.vx + c.vw * 1.0, c.vy + c.vh * 1.06, c.vh * 0.36, c.vh * 0.2, -0.15);
                stone(g, c.vx + c.vw * 0.9, c.vy + c.vh * 1.04, c.vh * 0.12, c.vh * 0.08, 0.1);
            },
        },
    ],

    rainforest: () => [
        land(0.12, 0.08, 0.6, (g, c) => {
            const h = ridge(g, c, 13, 0.56, 0.12, 1.4);
            const rand = mulberry(9);
            for (let i = 0; i < 60; i++) {
                const x = -c.width * 0.1 + rand() * c.width * 1.2;
                roundTree(g, x, h(x) + 2, c.vh * (0.035 + rand() * 0.03));
            }
        }),
        {
            role: 'land',
            depth: 0.32,
            parallax: 0.2,
            fogAt: 0.72,
            draw: (g, c) => {
                // Cliff on the right from which the waterfall drops.
                const x0 = c.vx + c.vw * 0.56;
                g.poly([
                    x0, c.vy + c.vh * 0.74,
                    x0 + c.vw * 0.05, c.vy + c.vh * 0.42,
                    x0 + c.vw * 0.12, c.vy + c.vh * 0.33,
                    c.vx + c.vw * 0.8, c.vy + c.vh * 0.32,
                    c.vx + c.vw * 0.93, c.vy + c.vh * 0.26,
                    c.width + c.width * 0.2, c.vy + c.vh * 0.3,
                    c.width + c.width * 0.2, c.vy + c.vh * 0.8,
                ]).fill(0xffffff);
            },
        },
        {
            role: 'waterfall',
            depth: 0.3,
            parallax: 0.2,
            fogAt: null,
            anim: 'flow',
            draw: (g, c) => {
                const x = c.vx + c.vw * 0.72;
                const w = c.vw * 0.045;
                g.poly([x, c.vy + c.vh * 0.33, x + w, c.vy + c.vh * 0.33, x + w * 1.5, c.vy + c.vh * 0.74, x - w * 0.5, c.vy + c.vh * 0.74]).fill(0xffffff);
            },
        },
        ...lake(0.72, 0.8),
        land(0.55, 0.4, null, (g, c) => {
            const rand = mulberry(13);
            for (let i = 0; i < 9; i++) {
                const x = c.vx + rand() * c.vw * 0.5;
                tallTree(g, x, c.vy + c.vh * 0.76, c.vh * (0.35 + rand() * 0.25));
            }
        }),
        frameGround(43),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                const rand = mulberry(17);
                trunk(g, c.vx + c.vw * 0.02, c.vy - c.vh * 0.1, c.vy + c.vh * 1.1, c.vw * 0.045, rand);
                bigLeaf(g, c.vx + c.vw * 1.02, c.vy + c.vh * 0.14, c.vh * 0.22, c.vh * 0.06, 2.8);
                bigLeaf(g, c.vx + c.vw * 1.01, c.vy + c.vh * 0.9, c.vh * 0.24, c.vh * 0.065, 3.7);
                bigLeaf(g, c.vx - c.vw * 0.01, c.vy + c.vh * 0.95, c.vh * 0.24, c.vh * 0.065, -0.55);
                bigLeaf(g, c.vx + c.vw * 0.04, c.vy + c.vh * 1.05, c.vh * 0.2, c.vh * 0.05, -1.05);
            },
        },
        {
            role: 'accent',
            depth: 1,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                // A single blossom — the zone's colour accent.
                const x = c.vx + c.vw * 0.915;
                const y = c.vy + c.vh * 0.86;
                for (let i = 0; i < 5; i++) {
                    const a = -Math.PI / 2 + (i - 2) * 0.42;
                    bigLeaf(g, x, y, c.vh * 0.04, c.vh * 0.009, a);
                }
            },
        },
    ],

    mountains: () => [
        land(0.1, 0.06, 0.62, (g, c) => ridge(g, c, 14, 0.62, 0.5, 1.2, { sharp: true, octaves: 4 })),
        {
            role: 'accent',
            depth: 0.1,
            parallax: 0.06,
            fogAt: null,
            draw: (g, c) => {
                // Snow caps: a band that follows the crest line down to a snow line.
                const noise = makeNoise1D(14);
                const margin = c.width * 0.15;
                const steps = Math.ceil((c.width + margin * 2) / 6);
                const snowLine = c.vy + c.vh * 0.46;
                const crest: [number, number][] = [];
                for (let i = 0; i <= steps; i++) {
                    const x = -margin + (i / steps) * (c.width + margin * 2);
                    crest.push([x, c.vy + c.vh * (0.62 - 0.5 * (ridged1D(noise, (x / c.vw) * 1.2, 4) - 0.3))]);
                }
                let run: [number, number][] = [];
                const flush = () => {
                    if (run.length > 2) {
                        const pts: number[] = [];
                        run.forEach(([x, y]) => pts.push(x, y));
                        for (let i = run.length - 1; i >= 0; i--) {
                            const [x, y] = run[i];
                            const wobble = Math.sin(x * 0.05) * c.vh * 0.006;
                            pts.push(x, y + (snowLine - y) * 0.55 + wobble);
                        }
                        g.poly(pts).fill(0xffffff);
                    }
                    run = [];
                };
                for (const point of crest) {
                    if (point[1] < snowLine) run.push(point);
                    else flush();
                }
                flush();
            },
        },
        land(0.3, 0.16, 0.68, (g, c) => {
            const h = ridge(g, c, 24, 0.67, 0.16, 1.9, { sharp: true, octaves: 3 });
            const rand = mulberry(19);
            for (let i = 0; i < 40; i++) {
                const x = -c.width * 0.1 + rand() * c.width * 1.2;
                pine(g, x, h(x) + 3, c.vh * (0.04 + rand() * 0.03));
            }
        }),
        land(0.5, 0.3, 0.74, (g, c) => {
            // Rugged cliff with a shrine gate on its crown.
            const x = c.vx + c.vw * 0.72;
            const rand = mulberry(53);
            const pts: number[] = [x - c.vw * 0.09, c.vy + c.vh * 0.8];
            const left: [number, number][] = [
                [-0.085, 0.7], [-0.07, 0.62], [-0.075, 0.57], [-0.055, 0.52], [-0.04, 0.5],
            ];
            const right: [number, number][] = [
                [0.09, 0.49], [0.1, 0.53], [0.12, 0.56], [0.115, 0.63], [0.135, 0.7], [0.15, 0.8],
            ];
            for (const [dx, dy] of left) pts.push(x + c.vw * dx + (rand() - 0.5) * c.vw * 0.01, c.vy + c.vh * dy);
            for (const [dx, dy] of right) pts.push(x + c.vw * dx + (rand() - 0.5) * c.vw * 0.01, c.vy + c.vh * dy);
            g.poly(pts).fill(0xffffff);
            const gx = x + c.vw * 0.02;
            const gy = c.vy + c.vh * 0.495;
            const gw = c.vh * 0.045;
            const gh = c.vh * 0.065;
            g.rect(gx - gw / 2, gy - gh, gw * 0.24, gh).fill(0xffffff);
            g.rect(gx + gw / 2 - gw * 0.24, gy - gh, gw * 0.24, gh).fill(0xffffff);
            g.rect(gx - gw * 0.65, gy - gh - gw * 0.2, gw * 1.3, gw * 0.22).fill(0xffffff);
            const treeRand = mulberry(29);
            for (let i = 0; i < 14; i++) pine(g, c.vx + treeRand() * c.vw * 0.55, c.vy + c.vh * 0.77, c.vh * (0.08 + treeRand() * 0.06));
        }),
        {
            role: 'glow',
            depth: 0.5,
            parallax: 0.3,
            fogAt: null,
            draw: (g, c) => {
                // Light seen through the shrine gate.
                const gx = c.vx + c.vw * 0.74;
                const gy = c.vy + c.vh * 0.495;
                const gw = c.vh * 0.045;
                const gh = c.vh * 0.065;
                g.rect(gx - gw / 2 + gw * 0.24, gy - gh, gw - gw * 0.48, gh).fill(0xffffff);
            },
        },
        frameGround(44, 0.8),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                pine(g, c.vx + c.vw * 0.04, c.vy + c.vh * 1.08, c.vh * 0.62);
                pine(g, c.vx + c.vw * 0.13, c.vy + c.vh * 1.08, c.vh * 0.42);
                pine(g, c.vx + c.vw * 0.97, c.vy + c.vh * 1.08, c.vh * 0.55);
            },
        },
    ],

    aurora: () => [
        land(0.1, 0.06, 0.63, (g, c) => ridge(g, c, 15, 0.63, 0.08, 1.1)),
        land(0.3, 0.16, 0.69, (g, c) => {
            ridge(g, c, 25, 0.69, 0.03, 1.6);
            const rand = mulberry(23);
            const ground = c.vy + c.vh * 0.69;
            for (let i = 0; i < 9; i++) {
                const x = c.vx + c.vw * (0.08 + i * 0.105 + (rand() - 0.5) * 0.04);
                stone(g, x, ground, c.vh * (0.03 + rand() * 0.03), c.vh * (0.08 + rand() * 0.16), (rand() - 0.5) * 0.3);
            }
        }),
        ...lake(0.7, 0.8),
        frameGround(45, 0.81),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                stone(g, c.vx + c.vw * 0.93, c.vy + c.vh * 1.05, c.vh * 0.14, c.vh * 0.62, -0.08);
                stone(g, c.vx + c.vw * 0.02, c.vy + c.vh * 1.05, c.vh * 0.22, c.vh * 0.18, 0.2);
            },
        },
        {
            role: 'glow',
            depth: 1,
            parallax: 1.3,
            fogAt: null,
            draw: (g, c) => {
                // A rune carved into the monolith.
                const x = c.vx + c.vw * 0.925;
                const y = c.vy + c.vh * 0.72;
                const s = c.vh * 0.05;
                g.moveTo(x, y - s)
                    .lineTo(x + s * 0.35, y - s * 0.3)
                    .lineTo(x - s * 0.2, y + s * 0.1)
                    .lineTo(x + s * 0.3, y + s)
                    .stroke({ width: Math.max(2, s * 0.12), color: 0xffffff, cap: 'round', join: 'round' });
            },
        },
    ],

    dreamworld: () => [
        land(0.12, 0.08, 0.72, (g, c) => ridge(g, c, 16, 0.72, 0.05, 1)),
        {
            role: 'land',
            depth: 0.28,
            parallax: 0.16,
            fogAt: null,
            anim: 'bob',
            draw: (g, c) => {
                const rand = mulberry(31);
                for (let i = 0; i < 8; i++) {
                    const x = c.vx + rand() * c.vw;
                    const y = c.vy + c.vh * (0.22 + rand() * 0.34);
                    floatingIsland(g, x, y, c.vh * (0.05 + rand() * 0.09), c.vh * (0.05 + rand() * 0.08), rand);
                }
            },
        },
        {
            role: 'land',
            depth: 0.45,
            parallax: 0.3,
            fogAt: null,
            anim: 'bob',
            phase: 1.7,
            draw: (g, c) => {
                const rand = mulberry(37);
                floatingIsland(g, c.vx + c.vw * 0.2, c.vy + c.vh * 0.46, c.vh * 0.2, c.vh * 0.16, rand);
                floatingIsland(g, c.vx + c.vw * 0.84, c.vy + c.vh * 0.38, c.vh * 0.16, c.vh * 0.14, rand);
            },
        },
        frameGround(46, 0.8),
        {
            role: 'frame',
            depth: 1.3,
            parallax: 1.3,
            fogAt: null,
            anim: 'bob',
            phase: 3.1,
            draw: (g, c) => {
                const rand = mulberry(41);
                floatingIsland(g, c.vx + c.vw * 0.02, c.vy + c.vh * 0.2, c.vh * 0.12, c.vh * 0.13, rand);
                floatingIsland(g, c.vx + c.vw * 0.985, c.vy + c.vh * 0.66, c.vh * 0.14, c.vh * 0.16, rand);
            },
        },
    ],
};

export class Terrain {
    readonly view = new Container();
    layers: TerrainLayer[] = [];

    build(zone: ZoneId) {
        this.layers.forEach((l) => l.view.destroy());
        this.view.removeChildren();
        this.layers = COMPOSITIONS[zone]().map((spec, i) => ({
            ...spec,
            phase: spec.phase ?? i * 0.9,
            view: new Graphics(),
        }));
    }

    draw(c: DrawCtx) {
        for (const layer of this.layers) {
            layer.view.clear();
            layer.draw(layer.view, c);
        }
    }
}
