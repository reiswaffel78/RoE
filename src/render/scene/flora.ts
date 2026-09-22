// Procedurally painted flora in a flat, illustrative style: muted colours,
// two or three flat tones per shape, no gloss, no outlines. Everything the
// garden shows is generated here at startup.

import { Texture } from 'pixi.js';
import type { PlantId } from '../../core';
import { mulberry } from './procedural';

type Ctx = CanvasRenderingContext2D;

export interface PaintedTexture {
    texture: Texture;
    /** soft glow anchors relative to the bottom-centre, in texture pixels */
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

const hexNum = (hex: string) => parseInt(hex.slice(1), 16);

const fill = (ctx: Ctx, color: string, path: () => void) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    path();
    ctx.fill();
};

/** Flat almond leaf from (x, y) along `angle`. */
const leaf = (ctx: Ctx, x: number, y: number, len: number, width: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    fill(ctx, color, () => {
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -width, len, 0);
        ctx.quadraticCurveTo(len * 0.45, width, 0, 0);
    });
    ctx.restore();
};

const stroke = (ctx: Ctx, color: string, width: number, path: () => void) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    path();
    ctx.stroke();
};

const disc = (ctx: Ctx, x: number, y: number, r: number, color: string) =>
    fill(ctx, color, () => ctx.arc(x, y, r, 0, Math.PI * 2));

/** Soft contact shadow, the only gradient we allow. */
const contactShadow = (ctx: Ctx, cx: number, cy: number, rx: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.18);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,0.28)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

// ------------------------------------------------------------------ plants

type Painter = (ctx: Ctx, w: number, h: number, rand: () => number) => PaintedTexture['glows'];

const paintLotus: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 6;
    contactShadow(ctx, cx, by, w * 0.4);
    fill(ctx, '#3f5a44', () => ctx.ellipse(cx - 24, by - 8, 34, 9, 0, 0, Math.PI * 2));
    fill(ctx, '#56745a', () => ctx.ellipse(cx + 26, by - 6, 30, 8, 0, 0, Math.PI * 2));
    const fy = by - 18;
    const petals: [number, number, string][] = [
        [-2.3, 40, '#b98892'], [-0.85, 40, '#b98892'],
        [-1.95, 46, '#cf9ea6'], [-1.2, 46, '#cf9ea6'],
        [-1.57, 52, '#e2bcc0'],
    ];
    for (const [a, len, color] of petals) leaf(ctx, cx, fy, len, 13, a, color);
    disc(ctx, cx, fy - 8, 5, '#e8d49a');
    return [];
};

const paintFern: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.32);
    const fronds = 7;
    for (let i = 0; i < fronds; i++) {
        const t = i / (fronds - 1) - 0.5;
        const len = h * (0.6 + 0.3 * (1 - Math.abs(t) * 1.6));
        const tipX = cx + t * w * 0.9;
        const tipY = by - len * (1 - Math.abs(t) * 0.55);
        const ctrlX = cx + t * w * 0.18;
        const ctrlY = by - len * 0.9;
        const tone = i % 2 ? '#3d6b6c' : '#4f7f7c';
        stroke(ctx, tone, 2, () => {
            ctx.moveTo(cx, by);
            ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        });
        for (let j = 1; j < 12; j++) {
            const s = j / 12;
            const px = (1 - s) * (1 - s) * cx + 2 * (1 - s) * s * ctrlX + s * s * tipX;
            const py = (1 - s) * (1 - s) * by + 2 * (1 - s) * s * ctrlY + s * s * tipY;
            const dx = 2 * (1 - s) * (ctrlX - cx) + 2 * s * (tipX - ctrlX);
            const dy = 2 * (1 - s) * (ctrlY - by) + 2 * s * (tipY - ctrlY);
            const dir = Math.atan2(dy, dx);
            const size = (1 - s) * 18 + 4;
            leaf(ctx, px, py, size, size * 0.26, dir - 1.15, tone);
            leaf(ctx, px, py, size, size * 0.26, dir + 1.15, tone);
        }
    }
    return [];
};

const paintSunpetal: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.28);
    stroke(ctx, '#55693f', 4, () => {
        ctx.moveTo(cx, by);
        ctx.quadraticCurveTo(cx - 12, by - h * 0.4, cx + 4, by - h * 0.66);
    });
    leaf(ctx, cx - 3, by - h * 0.28, 44, 12, -2.6, '#4d6139');
    leaf(ctx, cx - 5, by - h * 0.42, 40, 11, -0.45, '#62794a');
    const fx = cx + 4;
    const fy = by - h * 0.7;
    for (let i = 0; i < 14; i++) leaf(ctx, fx, fy, 36, 9, (i / 14) * Math.PI * 2, i % 2 ? '#c99a48' : '#d8ad5c');
    disc(ctx, fx, fy, 14, '#5b4128');
    disc(ctx, fx - 3, fy - 3, 6, '#6d5133');
    return [];
};

const paintWillow: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.38);
    fill(ctx, '#46434f', () => {
        ctx.moveTo(cx - 11, by);
        ctx.bezierCurveTo(cx - 3, by - h * 0.3, cx - 13, by - h * 0.5, cx - 2, by - h * 0.74);
        ctx.lineTo(cx + 6, by - h * 0.72);
        ctx.bezierCurveTo(cx - 1, by - h * 0.5, cx + 8, by - h * 0.3, cx + 12, by);
    });
    const topY = by - h * 0.8;
    fill(ctx, '#7f8494', () => ctx.ellipse(cx, topY + 22, w * 0.3, 30, 0, 0, Math.PI * 2));
    for (let i = 0; i < 30; i++) {
        const sx = cx + (rand() - 0.5) * w * 0.66;
        const sy = topY + 10 + rand() * 26;
        const len = h * (0.3 + rand() * 0.34);
        const ex = sx + (sx - cx) * 0.3;
        const ey = Math.min(by - 12, sy + len);
        stroke(ctx, i % 3 ? '#8e94a6' : '#a3a8b8', 5, () => {
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + (sx - cx) * 0.35, sy + len * 0.25, ex, ey);
        });
    }
    return [];
};

const paintOak: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.44);
    fill(ctx, '#4a3a2c', () => {
        ctx.moveTo(cx - 26, by);
        ctx.quadraticCurveTo(cx - 12, by - 14, cx - 12, by - h * 0.46);
        ctx.lineTo(cx + 12, by - h * 0.46);
        ctx.quadraticCurveTo(cx + 12, by - 14, cx + 28, by);
    });
    const cy = by - h * 0.64;
    const tones = ['#34503a', '#46654a', '#5c7d5c'];
    tones.forEach((tone, layer) => {
        const count = 8 - layer * 2;
        for (let i = 0; i < count; i++) {
            const a = rand() * Math.PI * 2;
            const r = (1 - layer * 0.25) * w * 0.22 * rand();
            const size = w * (0.17 - layer * 0.03) * (0.85 + rand() * 0.3);
            disc(ctx, cx + Math.cos(a) * r - layer * 8, cy + Math.sin(a) * r * 0.7 - layer * 10, size, tone);
        }
    });
    return [];
};

const paintDreamwood: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.36);
    for (let i = 0; i < 3; i++) {
        stroke(ctx, '#3b3150', 11 - i * 3, () => {
            ctx.moveTo(cx + (i - 1) * 6, by);
            ctx.bezierCurveTo(cx + 26 - i * 18, by - h * 0.25, cx - 26 + i * 14, by - h * 0.45, cx + (i - 1) * 16, by - h * 0.62);
        });
    }
    const cy = by - h * 0.7;
    const tones = ['#5a5670', '#6d6886', '#837d9c'];
    tones.forEach((tone, layer) => {
        for (let i = 0; i < 7 - layer * 2; i++) {
            const x = cx + (rand() - 0.5) * w * (0.6 - layer * 0.12) - layer * 6;
            const y = cy + (rand() - 0.5) * h * 0.24 - layer * 8;
            disc(ctx, x, y, w * (0.12 - layer * 0.02) * (0.85 + rand() * 0.3), tone);
        }
    });
    const glows: PaintedTexture['glows'] = [];
    for (let i = 0; i < 4; i++) {
        const x = cx + (rand() - 0.5) * w * 0.45;
        const y = cy + (rand() - 0.5) * h * 0.18;
        disc(ctx, x, y, 3, '#e8e2f0');
        glows.push({ x: x - cx, y: y - h, r: 12, color: 0xe6dcf6 });
    }
    return glows;
};

const paintEmberroot: Painter = (ctx, w, h, rand) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.42);
    const glows: PaintedTexture['glows'] = [];
    const branch = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;
        stroke(ctx, '#3b2622', width, () => {
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo((x + ex) / 2 + (rand() - 0.5) * 8, (y + ey) / 2, ex, ey);
        });
        if (depth <= 0) {
            disc(ctx, ex, ey, 5, '#c07448');
            if (rand() > 0.6) glows.push({ x: ex - cx, y: ey - h, r: 12, color: 0xd98a5a });
            return;
        }
        branch(ex, ey, angle - 0.5 - rand() * 0.3, len * 0.7, width * 0.65, depth - 1);
        branch(ex, ey, angle + 0.45 + rand() * 0.3, len * 0.68, width * 0.65, depth - 1);
    };
    for (let i = 0; i < 3; i++) branch(cx + (i - 1) * 10, by, -Math.PI / 2 + (i - 1) * 0.55, h * 0.3, 8, 3);
    return glows;
};

const paintStarbloom: Painter = (ctx, w, h) => {
    const cx = w / 2;
    const by = h - 4;
    contactShadow(ctx, cx, by, w * 0.22);
    stroke(ctx, '#3e5c63', 3, () => {
        ctx.moveTo(cx, by);
        ctx.bezierCurveTo(cx + 10, by - h * 0.5, cx - 8, by - h * 0.62, cx, by - h * 0.78);
    });
    leaf(ctx, cx + 2, by - h * 0.22, 34, 8, -0.5, '#3f6068');
    leaf(ctx, cx + 2, by - h * 0.36, 30, 7, -2.7, '#4f737b');
    const fx = cx;
    const fy = by - h * 0.8;
    ctx.save();
    ctx.translate(fx, fy);
    fill(ctx, '#dfe9ee', () => {
        for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? 26 : 10;
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
    });
    disc(ctx, 0, 0, 6, '#f5f1dd');
    ctx.restore();
    return [{ x: 0, y: fy - h, r: 40, color: 0xdfeef4 }];
};

const PAINTERS: Partial<Record<PlantId, { w: number; h: number; paint: Painter }>> = {
    lotus: { w: 150, h: 90, paint: paintLotus },
    fern: { w: 170, h: 160, paint: paintFern },
    sunpetal: { w: 130, h: 210, paint: paintSunpetal },
    willow: { w: 210, h: 250, paint: paintWillow },
    oak: { w: 250, h: 290, paint: paintOak },
    dreamwood: { w: 230, h: 290, paint: paintDreamwood },
    emberroot: { w: 190, h: 170, paint: paintEmberroot },
    starbloom: { w: 120, h: 250, paint: paintStarbloom },
};

export const paintPlant = (id: PlantId, variant: number): PaintedTexture | null => {
    const spec = PAINTERS[id];
    if (!spec) return null;
    const [c, ctx] = canvas(spec.w, spec.h);
    const glows = spec.paint(ctx, spec.w, spec.h, mulberry(variant * 977 + id.length * 31));
    return { texture: Texture.from(c), glows, width: spec.w, height: spec.h };
};

// ------------------------------------------------------------------ tree of life

export interface HeartTree {
    trunk: Texture;
    crown: Texture;
    width: number;
    height: number;
    /** canvas combining both parts in neutral colours (UI thumbnails) */
    preview: HTMLCanvasElement;
}

/**
 * The tree of life, painted in grey values so the scene can tint the crown
 * with the zone's foliage colour and the trunk with its deep tone.
 * Flat tones: shadow underside, midtone body, light upper-left.
 */
export const paintHeartTree = (): HeartTree => {
    const w = 640;
    const h = 700;
    const rand = mulberry(20260922);
    const cx = w / 2;
    const by = h - 8;

    const [trunkCanvas, t] = canvas(w, h);
    contactShadow(t, cx, by, w * 0.3);
    const branchTips: [number, number][] = [];
    const limb = (x: number, y: number, angle: number, len: number, width: number, depth: number) => {
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;
        stroke(t, '#9a9a9a', width, () => {
            t.moveTo(x, y);
            t.quadraticCurveTo(x + Math.cos(angle + 0.25) * len * 0.5, y + Math.sin(angle + 0.25) * len * 0.5, ex, ey);
        });
        if (depth <= 0) {
            branchTips.push([ex, ey]);
            return;
        }
        limb(ex, ey, angle - 0.38 - rand() * 0.12, len * 0.74, width * 0.64, depth - 1);
        limb(ex, ey, angle + 0.38 + rand() * 0.12, len * 0.74, width * 0.64, depth - 1);
    };
    fill(t, '#9a9a9a', () => {
        t.moveTo(cx - 30, by);
        t.bezierCurveTo(cx - 12, by - 60, cx - 20, by - 150, cx - 10, by - 220);
        t.lineTo(cx + 10, by - 220);
        t.bezierCurveTo(cx + 20, by - 150, cx + 12, by - 60, cx + 30, by);
    });
    fill(t, '#8a8a8a', () => {
        t.moveTo(cx - 30, by);
        t.quadraticCurveTo(cx - 56, by + 2, cx - 74, by + 4);
        t.lineTo(cx - 24, by - 12);
        t.moveTo(cx + 30, by);
        t.quadraticCurveTo(cx + 58, by + 2, cx + 78, by + 4);
        t.lineTo(cx + 24, by - 12);
    });
    limb(cx, by - 210, -Math.PI / 2 - 0.5, 110, 18, 3);
    limb(cx, by - 210, -Math.PI / 2 + 0.5, 110, 18, 3);
    limb(cx, by - 215, -Math.PI / 2, 100, 16, 3);

    // Crown: one calm cloud-like mass built from overlapping discs.
    const [crownCanvas, k] = canvas(w, h);
    const crownY = by - 370;
    const blobs: [number, number, number][] = [];
    for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const rx = 190 + (rand() - 0.5) * 30;
        const ry = 120 + (rand() - 0.5) * 20;
        blobs.push([cx + Math.cos(a) * rx * 0.72, crownY + Math.sin(a) * ry * 0.7, 62 + rand() * 30]);
    }
    for (const [x, y] of branchTips) blobs.push([x, y - 10, 46 + rand() * 18]);
    blobs.push([cx, crownY, 150]);
    // Shadow underside.
    for (const [x, y, r] of blobs) disc(k, x, y + 14, r, '#8c8c8c');
    // Body.
    for (const [x, y, r] of blobs) disc(k, x, y, r * 0.94, '#c4c4c4');
    // Light from the upper left.
    for (const [x, y, r] of blobs) {
        if (y < crownY + 20 && x < cx + 80) disc(k, x - 16, y - 18, r * 0.62, '#ececec');
    }

    // Crop both canvases identically, keeping the bottom-centre anchor.
    const ctx = crownCanvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, w, h).data;
    let top = h;
    let left = w;
    let right = 0;
    for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
            if (data[(y * w + x) * 4 + 3] > 8) {
                if (y < top) top = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    const half = Math.min(cx, Math.max(cx - left, right - cx) + 8);
    const t0 = Math.max(0, top - 8);
    const crop = (source: HTMLCanvasElement) => {
        const [out, o] = canvas(Math.ceil(half * 2), h - t0);
        o.drawImage(source, cx - half, t0, half * 2, h - t0, 0, 0, half * 2, h - t0);
        return out;
    };
    const trunkOut = crop(trunkCanvas);
    const crownOut = crop(crownCanvas);

    const [preview, p] = canvas(trunkOut.width, trunkOut.height);
    p.filter = 'sepia(0.4) hue-rotate(40deg) saturate(1.2) brightness(0.8)';
    p.drawImage(trunkOut, 0, 0);
    p.filter = 'sepia(1) hue-rotate(50deg) saturate(1.1) brightness(0.9)';
    p.drawImage(crownOut, 0, 0);

    return {
        trunk: Texture.from(trunkOut),
        crown: Texture.from(crownOut),
        width: trunkOut.width,
        height: trunkOut.height,
        preview,
    };
};

// ------------------------------------------------------------------ UI thumbnails

const imageCache = new Map<string, string>();

/** Painted plant as data URL for UI thumbnails (same art as the scene). */
export const plantImage = (id: PlantId): string => {
    const cached = imageCache.get(id);
    if (cached) return cached;
    let url = '';
    try {
        if (id === 'worldtree') {
            url = paintHeartTree().preview.toDataURL();
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

// ------------------------------------------------------------------ utility textures (white, tinted in the scene)

export const paintGrass = (variant: number): Texture => {
    const w = 170;
    const h = 60;
    const [c, ctx] = canvas(w, h);
    const rand = mulberry(variant * 131 + 7);
    for (let i = 0; i < 22; i++) {
        const x = 8 + rand() * (w - 16);
        const height = h * (0.35 + rand() * 0.65);
        const lean = (rand() - 0.5) * 26;
        fill(ctx, '#ffffff', () => {
            ctx.moveTo(x - 2.5, h);
            ctx.quadraticCurveTo(x + lean * 0.3, h - height * 0.6, x + lean, h - height);
            ctx.quadraticCurveTo(x + lean * 0.3 + 1.5, h - height * 0.5, x + 2.5, h);
        });
    }
    return Texture.from(c);
};

export const paintGlow = (): Texture => {
    const s = 128;
    const [c, ctx] = canvas(s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return Texture.from(c);
};

/** Small soft dot for motes, fireflies and sparks. */
export const paintSpark = (): Texture => {
    const s = 32;
    const [c, ctx] = canvas(s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return Texture.from(c);
};

/** Vertical fade: transparent top → opaque bottom. */
export const paintFade = (): Texture => {
    const [c, ctx] = canvas(4, 128);
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 128);
    return Texture.from(c);
};

/** Horizontally tileable soft mist band. */
export const paintMist = (): Texture => {
    const w = 512;
    const h = 160;
    const [c, ctx] = canvas(w, h);
    const rand = mulberry(99);
    for (let i = 0; i < 60; i++) {
        const x = rand() * w;
        const y = h * (0.4 + rand() * 0.35);
        const r = 30 + rand() * 70;
        for (const dx of [-w, 0, w]) {
            const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
            g.addColorStop(0, 'rgba(255,255,255,0.14)');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(x + dx, y, r * 1.8, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    return Texture.from(c);
};

export const paintRain = (): Texture => {
    const [c, ctx] = canvas(2, 48);
    const g = ctx.createLinearGradient(0, 0, 0, 48);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 48);
    return Texture.from(c);
};

export const paintLeaf = (): Texture => {
    const [c, ctx] = canvas(22, 12);
    leaf(ctx, 1, 6, 20, 5, 0, '#ffffff');
    return Texture.from(c);
};

export const paintRing = (): Texture => {
    const s = 256;
    const [c, ctx] = canvas(s, s);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    return Texture.from(c);
};

export const hexColor = hexNum;
