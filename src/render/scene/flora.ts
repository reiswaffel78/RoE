// Procedurally painted textures (Canvas 2D → Pixi textures). Everything the
// garden shows is generated here at startup: plants, the heart tree, grass,
// glows, fog gradients, mist, rain and leaves.

import { Texture } from 'pixi.js';
import type { PlantId } from '../../core';
import { mulberry } from './procedural';

type Ctx = CanvasRenderingContext2D;

export interface PaintedTexture {
    texture: Texture;
    /** glow anchors relative to the bottom-centre, in texture pixels */
    glows: { x: number; y: number; r: number; color: number }[];
    width: number;
    height: number;
}

const canvas = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    return [c, ctx];
};

const rgba = (hex: string, a: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const hexNum = (hex: string) => parseInt(hex.slice(1), 16);

/** Almond leaf with gradient and midrib, from (x,y) along `angle`. */
const leaf = (ctx: Ctx, x: number, y: number, len: number, width: number, angle: number, base: string, tip: string, rib = true) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, base);
    grad.addColorStop(1, tip);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.4, -width, len, 0);
    ctx.quadraticCurveTo(len * 0.4, width, 0, 0);
    ctx.fill();
    if (rib) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = Math.max(0.6, width * 0.08);
        ctx.beginPath();
        ctx.moveTo(len * 0.05, 0);
        ctx.lineTo(len * 0.92, 0);
        ctx.stroke();
    }
    ctx.restore();
};

const stem = (ctx: Ctx, pts: number[], width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    if (pts.length === 6) ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    else ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
    ctx.stroke();
};

const softDot = (ctx: Ctx, x: number, y: number, r: number, color: string, alpha = 1) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, alpha));
    g.addColorStop(0.4, rgba(color, alpha * 0.45));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
};

const groundShadow = (ctx: Ctx, cx: number, cy: number, rx: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(cx, cy / 0.25, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

// ------------------------------------------------------------------ plants

type Painter = (ctx: Ctx, w: number, h: number, rand: () => number) => PaintedTexture['glows'];

const paintLotus: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 6;
    groundShadow(ctx, cx, by, w * 0.42);
    // stone
    const stone = ctx.createRadialGradient(cx - 14, by - 26, 4, cx, by - 12, w * 0.4);
    stone.addColorStop(0, '#9ea3a8');
    stone.addColorStop(1, '#3a3f47');
    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.ellipse(cx, by - 12, w * 0.36, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // pads
    for (const [dx, s] of [[-30, 1], [32, 0.85]] as const) {
        const pad = ctx.createRadialGradient(cx + dx, by - 26, 2, cx + dx, by - 24, 34 * s);
        pad.addColorStop(0, '#6fbf73');
        pad.addColorStop(1, '#23583a');
        ctx.fillStyle = pad;
        ctx.beginPath();
        ctx.ellipse(cx + dx, by - 24, 34 * s, 11 * s, 0, 0.25, Math.PI * 2 - 0.1);
        ctx.lineTo(cx + dx, by - 24);
        ctx.fill();
    }
    // petals, back to front
    const fy = by - 44;
    const petals = [
        [-1.9, 44, '#e9a7c4'], [1.9 - Math.PI, 44, '#e9a7c4'],
        [-1.35, 50, '#f4c3d8'], [-1.8 + Math.PI, 50, '#f4c3d8'],
        [-0.95, 54, '#fbe0ea'], [-2.2, 54, '#fbe0ea'],
        [-1.57, 58, '#fff4f8'],
    ] as const;
    for (const [angle, len, color] of petals) leaf(ctx, cx, fy, len, 15, angle, '#f7d6e4', color, false);
    softDot(ctx, cx, fy - 8, 12, '#ffd66e', 0.9);
    return [{ x: 0, y: -(h - fy) - 8, r: 26, color: 0xffd6e6 }];
};

const paintFern: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.35);
    const glows: PaintedTexture['glows'] = [];
    const fronds = 7;
    for (let i = 0; i < fronds; i++) {
        const t = i / (fronds - 1) - 0.5;
        const len = h * (0.62 + 0.28 * (1 - Math.abs(t) * 1.6));
        const tipX = cx + t * w * 0.95;
        const tipY = by - len * (1 - Math.abs(t) * 0.55);
        const ctrlX = cx + t * w * 0.2;
        const ctrlY = by - len * 0.9;
        stem(ctx, [cx, by, ctrlX, ctrlY, tipX, tipY], 2.2, '#2b6d6a');
        const leaflets = 11;
        for (let j = 1; j < leaflets; j++) {
            const s = j / leaflets;
            const px = (1 - s) * (1 - s) * cx + 2 * (1 - s) * s * ctrlX + s * s * tipX;
            const py = (1 - s) * (1 - s) * by + 2 * (1 - s) * s * ctrlY + s * s * tipY;
            const dx = 2 * (1 - s) * (ctrlX - cx) + 2 * s * (tipX - ctrlX);
            const dy = 2 * (1 - s) * (ctrlY - by) + 2 * s * (tipY - ctrlY);
            const dir = Math.atan2(dy, dx);
            const size = (1 - s) * 22 + 5;
            leaf(ctx, px, py, size, size * 0.3, dir - 1.1, '#1f5d5f', s > 0.7 ? '#7fe8e0' : '#3d9b8f', false);
            leaf(ctx, px, py, size, size * 0.3, dir + 1.1, '#1f5d5f', s > 0.7 ? '#7fe8e0' : '#3d9b8f', false);
        }
        softDot(ctx, tipX, tipY, 9, '#9ffff4', 0.95);
        if (rand() > 0.3) glows.push({ x: tipX - cx, y: tipY - h, r: 18, color: 0x8ff7f0 });
    }
    return glows;
};

const paintSunpetal: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.3);
    stem(ctx, [cx, by, cx - 14, by - h * 0.4, cx + 4, by - h * 0.66], 5, '#4f8a3a');
    leaf(ctx, cx - 4, by - h * 0.28, 48, 14, -2.6, '#3f7a34', '#8cc45a');
    leaf(ctx, cx - 6, by - h * 0.42, 44, 12, -0.4, '#3f7a34', '#8cc45a');
    const fx = cx + 4;
    const fy = by - h * 0.7;
    const petals = 16;
    for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2;
        leaf(ctx, fx, fy, 40, 10, a, '#f4a52c', '#ffe27a', false);
    }
    for (let i = 0; i < petals; i++) {
        const a = ((i + 0.5) / petals) * Math.PI * 2;
        leaf(ctx, fx, fy, 30, 8, a, '#e98b1d', '#ffd05a', false);
    }
    const disk = ctx.createRadialGradient(fx - 4, fy - 4, 2, fx, fy, 17);
    disk.addColorStop(0, '#8a5a2b');
    disk.addColorStop(1, '#3b2412');
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(fx, fy, 16, 0, Math.PI * 2);
    ctx.fill();
    return [{ x: fx - cx, y: fy - h, r: 48, color: 0xffd36b }];
};

const paintWillow: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.4);
    const trunk = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
    trunk.addColorStop(0, '#3f3a4a');
    trunk.addColorStop(1, '#6d6780');
    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(cx - 12, by);
    ctx.bezierCurveTo(cx - 4, by - h * 0.3, cx - 14, by - h * 0.5, cx - 2, by - h * 0.72);
    ctx.lineTo(cx + 6, by - h * 0.7);
    ctx.bezierCurveTo(cx - 2, by - h * 0.5, cx + 8, by - h * 0.3, cx + 12, by);
    ctx.fill();
    const topY = by - h * 0.78;
    // crown mass
    softDot(ctx, cx, topY + 20, w * 0.36, '#a9b8e8', 0.55);
    const strands = 34;
    const glows: PaintedTexture['glows'] = [];
    for (let i = 0; i < strands; i++) {
        const sx = cx + (rand() - 0.5) * w * 0.7;
        const sy = topY + rand() * 30;
        const len = h * (0.35 + rand() * 0.35);
        const ex = sx + (sx - cx) * 0.35;
        const ey = Math.min(by - 10, sy + len);
        ctx.strokeStyle = rgba(rand() > 0.5 ? '#c9d6ff' : '#9fb3ea', 0.85);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + (sx - cx) * 0.4, sy + len * 0.2, ex, ey);
        ctx.stroke();
        for (let k = 0.2; k < 1; k += 0.14) {
            const px = sx + (ex - sx) * k + (sx - cx) * 0.18 * Math.sin(k * 3);
            const py = sy + (ey - sy) * k;
            leaf(ctx, px, py, 7, 2.4, Math.PI / 2 + (rand() - 0.5), '#8ea3e0', '#e4ecff', false);
        }
        if (i % 7 === 0) glows.push({ x: ex - cx, y: ey - h, r: 12, color: 0xc7d6ff });
    }
    return glows;
};

const paintOak: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.45);
    const trunk = ctx.createLinearGradient(cx - 20, 0, cx + 20, 0);
    trunk.addColorStop(0, '#3a2718');
    trunk.addColorStop(0.6, '#6b4a2c');
    trunk.addColorStop(1, '#2d1d12');
    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(cx - 30, by);
    ctx.quadraticCurveTo(cx - 14, by - 12, cx - 14, by - h * 0.45);
    ctx.lineTo(cx + 14, by - h * 0.45);
    ctx.quadraticCurveTo(cx + 14, by - 12, cx + 32, by);
    ctx.fill();
    const shades = ['#1f4a2a', '#2e6a36', '#468a44', '#6fae58'];
    const cy = by - h * 0.62;
    for (let layer = 0; layer < shades.length; layer++) {
        const count = 9 - layer;
        for (let i = 0; i < count; i++) {
            const a = rand() * Math.PI * 2;
            const r = (1 - layer * 0.18) * w * 0.26 * rand();
            const x = cx + Math.cos(a) * r - layer * 5;
            const y = cy + Math.sin(a) * r * 0.7 - layer * 8;
            const size = w * (0.16 - layer * 0.02) * (0.8 + rand() * 0.4);
            const g = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 1, x, y, size);
            g.addColorStop(0, shades[Math.min(shades.length - 1, layer + 1)]);
            g.addColorStop(1, shades[layer]);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return [];
};

const paintDreamwood: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.4);
    ctx.strokeStyle = '#3b2552';
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
        ctx.lineWidth = 12 - i * 3;
        ctx.beginPath();
        ctx.moveTo(cx + (i - 1) * 6, by);
        ctx.bezierCurveTo(cx + 30 - i * 20, by - h * 0.25, cx - 30 + i * 15, by - h * 0.45, cx + (i - 1) * 18, by - h * 0.62);
        ctx.stroke();
    }
    const glows: PaintedTexture['glows'] = [];
    const cy = by - h * 0.68;
    for (let i = 0; i < 16; i++) {
        const x = cx + (rand() - 0.5) * w * 0.7;
        const y = cy + (rand() - 0.5) * h * 0.32;
        const r = w * (0.08 + rand() * 0.1);
        const g = ctx.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, 'rgba(214,160,255,0.95)');
        g.addColorStop(0.7, 'rgba(126,76,196,0.8)');
        g.addColorStop(1, 'rgba(80,40,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    for (let i = 0; i < 9; i++) {
        const x = cx + (rand() - 0.5) * w * 0.6;
        const y = cy + (rand() - 0.5) * h * 0.28;
        const color = rand() > 0.5 ? '#ff9ff3' : '#8ff0ff';
        softDot(ctx, x, y, 7, color, 1);
        glows.push({ x: x - cx, y: y - h, r: 16, color: hexNum(color) });
    }
    return glows;
};

const paintEmberroot: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.45);
    const glows: PaintedTexture['glows'] = [];
    const branch = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;
        ctx.strokeStyle = '#2a1410';
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo((x + ex) / 2 + (rand() - 0.5) * 10, (y + ey) / 2, ex, ey);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,120,40,0.55)';
        ctx.lineWidth = Math.max(0.8, width * 0.25);
        ctx.stroke();
        if (depth <= 0) {
            softDot(ctx, ex, ey, 9, '#ffb347', 1);
            if (rand() > 0.4) glows.push({ x: ex - cx, y: ey - h, r: 20, color: 0xff8a3d });
            return;
        }
        branch(ex, ey, angle - 0.5 - rand() * 0.3, len * 0.72, width * 0.65, depth - 1);
        branch(ex, ey, angle + 0.45 + rand() * 0.3, len * 0.7, width * 0.65, depth - 1);
    };
    for (let i = 0; i < 3; i++) branch(cx + (i - 1) * 10, by, -Math.PI / 2 + (i - 1) * 0.55, h * 0.3, 9, 3);
    return glows;
};

const paintStarbloom: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 4;
    groundShadow(ctx, cx, by, w * 0.25);
    stem(ctx, [cx, by, cx + 10, by - h * 0.5, cx - 8, by - h * 0.62, cx, by - h * 0.78], 3, '#2f6a78');
    leaf(ctx, cx + 2, by - h * 0.22, 36, 8, -0.5, '#2c5d6e', '#7ad3e8');
    leaf(ctx, cx + 2, by - h * 0.36, 32, 7, -2.7, '#2c5d6e', '#7ad3e8');
    const fx = cx;
    const fy = by - h * 0.8;
    softDot(ctx, fx, fy, 46, '#8ef3ff', 0.45);
    ctx.save();
    ctx.translate(fx, fy);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#c8f7ff');
    grad.addColorStop(1, '#5bc9e6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 30 : 11;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return [{ x: 0, y: fy - h, r: 60, color: 0x9ff4ff }];
};

const PAINTERS: Partial<Record<PlantId, { w: number; h: number; paint: Painter }>> = {
    lotus: { w: 150, h: 120, paint: paintLotus },
    fern: { w: 180, h: 170, paint: paintFern },
    sunpetal: { w: 140, h: 220, paint: paintSunpetal },
    willow: { w: 220, h: 260, paint: paintWillow },
    oak: { w: 260, h: 300, paint: paintOak },
    dreamwood: { w: 240, h: 300, paint: paintDreamwood },
    emberroot: { w: 200, h: 180, paint: paintEmberroot },
    starbloom: { w: 130, h: 260, paint: paintStarbloom },
};

const imageCache = new Map<string, string>();

/** Painted plant as data URL for UI thumbnails (same art as the scene). */
export const plantImage = (id: PlantId): string => {
    const cached = imageCache.get(id);
    if (cached) return cached;
    let url = '';
    try {
        if (id === 'worldtree') {
            const painted = paintHeartTree(true);
            url = (painted.texture.source.resource as HTMLCanvasElement).toDataURL();
        } else {
            const spec = PAINTERS[id];
            if (spec) {
                const [c, ctx] = canvas(spec.w, spec.h);
                spec.paint(ctx, spec.w, spec.h, mulberry(id.length * 31));
                url = c.toDataURL();
            }
        }
    } catch {
        url = '';
    }
    imageCache.set(id, url);
    return url;
};

export const paintPlant = (id: PlantId, variant: number): PaintedTexture | null => {
    const spec = PAINTERS[id];
    if (!spec) return null;
    const [c, ctx] = canvas(spec.w, spec.h);
    const glows = spec.paint(ctx, spec.w, spec.h, mulberry(variant * 977 + id.length * 31));
    return { texture: Texture.from(c), glows, width: spec.w, height: spec.h };
};

// ------------------------------------------------------------------ heart tree

export const paintHeartTree = (crowned: boolean): PaintedTexture => {
    const w = 1000;
    const h = 900;
    const [c, ctx] = canvas(w, h);
    const rand = mulberry(20260922);
    const cx = w / 2;
    const by = h - 10;
    groundShadow(ctx, cx, by, w * 0.34);
    const glows: PaintedTexture['glows'] = [];
    const clusters: [number, number, number][] = [];

    const bark = (x: number, y: number, width: number) => {
        const grad = ctx.createLinearGradient(x - width, y, x + width, y);
        grad.addColorStop(0, '#23160f');
        grad.addColorStop(0.35, '#5a3f2c');
        grad.addColorStop(0.6, '#3d2a1d');
        grad.addColorStop(1, '#1b110b');
        return grad;
    };

    const branch = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
        const bend = (rand() - 0.5) * 0.35;
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;
        ctx.strokeStyle = bark(x, y, width);
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(angle + bend) * len * 0.5, y + Math.sin(angle + bend) * len * 0.5, ex, ey);
        ctx.stroke();
        if (depth <= 3) clusters.push([ex, ey, 26 + depth * 6 + rand() * 14]);
        if (depth <= 0) return;
        const splits = depth >= 5 ? 2 : 3;
        for (let i = 0; i < splits; i++) {
            const spread = splits === 2 ? 0.42 : 0.5;
            const a = angle + (i - (splits - 1) / 2) * spread + (rand() - 0.5) * 0.25;
            // Pull limbs slightly upwards for a rounded, majestic crown.
            const up = a + (-Math.PI / 2 - a) * 0.3;
            branch(ex, ey, up, len * (0.74 + rand() * 0.08), width * 0.66, depth - 1);
        }
    };

    // Root flare.
    ctx.fillStyle = '#24170f';
    for (let i = 0; i < 6; i++) {
        const dir = (i - 2.5) / 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + dir * 14, by - 46);
        ctx.quadraticCurveTo(cx + dir * 40, by - 10, cx + dir * 86, by + 2);
        ctx.lineTo(cx + dir * 70, by + 5);
        ctx.quadraticCurveTo(cx + dir * 26, by - 2, cx + dir * 4, by - 12);
        ctx.fill();
    }
    // Trunk with taper.
    ctx.fillStyle = bark(cx, by, 34);
    ctx.beginPath();
    ctx.moveTo(cx - 34, by);
    ctx.bezierCurveTo(cx - 20, by - 80, cx - 26, by - 150, cx - 14, by - 190);
    ctx.lineTo(cx + 14, by - 190);
    ctx.bezierCurveTo(cx + 26, by - 150, cx + 20, by - 80, cx + 34, by);
    ctx.fill();
    branch(cx, by - 180, -Math.PI / 2 - 0.35, 120, 24, 5);
    branch(cx, by - 180, -Math.PI / 2 + 0.35, 120, 24, 5);
    branch(cx, by - 185, -Math.PI / 2, 110, 20, 5);

    // Crown bounds for volumetric lighting (light from the upper left).
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y, r] of clusters) {
        minX = Math.min(minX, x - r);
        maxX = Math.max(maxX, x + r);
        minY = Math.min(minY, y - r);
        maxY = Math.max(maxY, y + r);
    }
    const shade = crowned
        ? ['#2a1d4d', '#44307c', '#6d4fb0', '#a98ad8', '#f1d8a4']
        : ['#11302a', '#1d4d3b', '#2f7150', '#57a06a', '#b6e3a0'];
    const pick = (light: number) => shade[Math.max(0, Math.min(shade.length - 1, Math.round(light * (shade.length - 1))))];
    const dabs: { x: number; y: number; r: number; light: number }[] = [];
    for (const [x, y, r] of clusters) {
        for (let i = 0; i < 7; i++) {
            const a = rand() * Math.PI * 2;
            const d = rand() * r * 0.8;
            const dx = x + Math.cos(a) * d;
            const dy = y + Math.sin(a) * d * 0.8;
            const nx = (dx - minX) / (maxX - minX);
            const ny = (dy - minY) / (maxY - minY);
            const light = Math.max(0, Math.min(1, 1.05 - ny * 0.85 - nx * 0.35 + (rand() - 0.5) * 0.25));
            dabs.push({ x: dx, y: dy, r: r * (0.42 + rand() * 0.3), light });
        }
    }
    // Paint dark to light so highlights sit on top.
    for (const pass of [0, 1, 2]) {
        for (const dab of dabs) {
            const level = pass === 0 ? dab.light * 0.5 : pass === 1 ? dab.light * 0.85 : dab.light;
            if (pass === 2 && dab.light < 0.55) continue;
            const off = pass * 4;
            const r = dab.r * (1 - pass * 0.22);
            const x = dab.x - off;
            const y = dab.y - off * 1.2;
            const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
            g.addColorStop(0, pick(Math.min(1, level + 0.18)));
            g.addColorStop(1, pick(level));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Small leaf dabs for texture.
    for (let i = 0; i < 420; i++) {
        const dab = dabs[Math.floor(rand() * dabs.length)];
        const a = rand() * Math.PI * 2;
        const x = dab.x + Math.cos(a) * dab.r;
        const y = dab.y + Math.sin(a) * dab.r;
        ctx.fillStyle = rgba(pick(Math.min(1, dab.light + 0.1)), 0.9);
        ctx.beginPath();
        ctx.ellipse(x, y, 5 + rand() * 4, 3 + rand() * 2, a, 0, Math.PI * 2);
        ctx.fill();
    }
    // Luminous seeds.
    for (let i = 0; i < clusters.length; i += 3) {
        const [x, y, r] = clusters[i];
        const px = x + (rand() - 0.5) * r;
        const py = y + (rand() - 0.5) * r * 0.6;
        const color = crowned ? (i % 4 ? '#ffe7a3' : '#e6c4ff') : i % 4 ? '#d9ffc2' : '#a8f3ff';
        softDot(ctx, px, py, 5, color, 0.8);
        if (i % 6 === 0) glows.push({ x: px - cx, y: py - h, r: 18, color: hexNum(color) });
    }
    return cropSymmetric(c, glows);
};

/** Crops transparent borders while keeping the bottom-centre anchor. */
const cropSymmetric = (source: HTMLCanvasElement, glows: PaintedTexture['glows']): PaintedTexture => {
    const ctx = source.getContext('2d')!;
    const { width, height } = source;
    const data = ctx.getImageData(0, 0, width, height).data;
    let top = height;
    let left = width;
    let right = 0;
    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            if (data[(y * width + x) * 4 + 3] > 8) {
                if (y < top) top = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    const cx = width / 2;
    const half = Math.min(cx, Math.max(cx - left, right - cx) + 8);
    const t = Math.max(0, top - 8);
    const [c, out] = canvas(Math.ceil(half * 2), height - t);
    out.drawImage(source, cx - half, t, half * 2, height - t, 0, 0, half * 2, height - t);
    return { texture: Texture.from(c), glows, width: c.width, height: c.height };
};

// ------------------------------------------------------------------ utility textures

export const paintGrass = (variant: number): Texture => {
    const w = 160;
    const h = 70;
    const [c, ctx] = canvas(w, h);
    const rand = mulberry(variant * 131 + 7);
    for (let i = 0; i < 26; i++) {
        const x = 10 + rand() * (w - 20);
        const height = h * (0.4 + rand() * 0.6);
        const lean = (rand() - 0.5) * 30;
        const g = ctx.createLinearGradient(0, h, 0, h - height);
        g.addColorStop(0, '#0d1f16');
        g.addColorStop(1, rand() > 0.5 ? '#3d7a4a' : '#2d5e3c');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - 3, h);
        ctx.quadraticCurveTo(x + lean * 0.3, h - height * 0.6, x + lean, h - height);
        ctx.quadraticCurveTo(x + lean * 0.3 + 2, h - height * 0.5, x + 3, h);
        ctx.fill();
    }
    return Texture.from(c);
};

export const paintGlow = (): Texture => {
    const s = 128;
    const [c, ctx] = canvas(s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return Texture.from(c);
};

export const paintSpark = (): Texture => {
    const s = 32;
    const [c, ctx] = canvas(s, s);
    softDot(ctx, s / 2, s / 2, s / 2, '#ffffff', 1);
    softDot(ctx, s / 2, s / 2, s / 6, '#ffffff', 1);
    return Texture.from(c);
};

/** Vertical fade: transparent top → opaque bottom. */
export const paintFade = (): Texture => {
    const [c, ctx] = canvas(4, 128);
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
    return Texture.from(c);
};

/** Horizontally tileable soft mist. */
export const paintMist = (): Texture => {
    const w = 512;
    const h = 160;
    const [c, ctx] = canvas(w, h);
    const rand = mulberry(99);
    for (let i = 0; i < 70; i++) {
        const x = rand() * w;
        const y = h * (0.35 + rand() * 0.4);
        const r = 30 + rand() * 70;
        for (const dx of [-w, 0, w]) softDot(ctx, x + dx, y, r, '#ffffff', 0.18);
    }
    return Texture.from(c);
};

export const paintRain = (): Texture => {
    const [c, ctx] = canvas(4, 64);
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = g;
    ctx.fillRect(1, 0, 2, 64);
    return Texture.from(c);
};

export const paintLeaf = (): Texture => {
    const [c, ctx] = canvas(24, 14);
    leaf(ctx, 1, 7, 22, 6, 0, '#ffffff', '#dddddd');
    return Texture.from(c);
};

export const paintRing = (): Texture => {
    const s = 256;
    const [c, ctx] = canvas(s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.36, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return Texture.from(c);
};
