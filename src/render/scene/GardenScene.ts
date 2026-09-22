// The living garden: orchestrates sky, parallax landscape, flora, weather and
// particle effects. Reads the game store every frame (no React involvement)
// and reacts to fx events for juicy feedback.

// Eval-free code paths: required under strict Content-Security-Policies.
import 'pixi.js/unsafe-eval';
import { Application, Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { AdvancedBloomFilter } from 'pixi-filters';
import { PLANTS, getDayInfo, type PlantId, type WeatherKind, type ZoneId } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { fx, type FxEvent } from '../../store/fx';
import type { Quality } from '../../store/settingsStore';
import { mix } from './color';
import {
    paintFade,
    paintGlow,
    paintGrass,
    paintHeartTree,
    paintLeaf,
    paintMist,
    paintPlant,
    paintRain,
    paintRing,
    paintSpark,
    type PaintedTexture,
} from './flora';
import { Landscape } from './landscape';
import { ZONE_GRADES, gradePalette, type Palette } from './palette';
import { ParticleLayer, behaviours } from './particles';
import { mulberry } from './procedural';
import { Sky } from './sky';

export interface Viewport {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface PlantInstance {
    id: PlantId;
    slot: number;
    root: Container;
    sprite: Sprite;
    glows: { sprite: Sprite; base: number; phase: number }[];
    phase: number;
    born: number;
    depth: number;
    ethereal: boolean;
}

const QUALITY = {
    low: { resolution: 1, particles: 160, grass: 10, perPlant: 4, bloom: false, fireflies: 14 },
    medium: { resolution: 1.5, particles: 420, grass: 18, perPlant: 6, bloom: false, fireflies: 28 },
    high: { resolution: 2, particles: 800, grass: 26, perPlant: 7, bloom: true, fireflies: 42 },
} as const;

const PLANT_SCALE: Record<PlantId, number> = {
    lotus: 0.55,
    fern: 0.6,
    sunpetal: 0.62,
    willow: 0.78,
    oak: 0.85,
    dreamwood: 0.85,
    emberroot: 0.62,
    starbloom: 0.72,
    worldtree: 1,
};

const RITUAL_COLORS: Record<string, number> = {
    meditation: 0xb79cff,
    grounding: 0xffc070,
    drums: 0xff8a5c,
    offering: 0xfff1c2,
    rainDance: 0x8fc8ff,
    vigil: 0xcfe0ff,
    spiritCall: 0x8dffcf,
};

const smooth = (current: number, target: number, rate: number, dt: number) =>
    current + (target - current) * (1 - Math.exp(-rate * dt));

export class GardenScene {
    private app!: Application;
    private sky = new Sky();
    private world = new Container();
    private landscape = new Landscape();
    private fogBands: Sprite[] = [];
    private mist: TilingSprite[] = [];
    private groundShade!: Sprite;
    private garden = new Container();
    private grass = new Container();
    private fxLayer!: ParticleLayer;
    private ambient!: ParticleLayer;
    private weatherLayer!: ParticleLayer;
    private flash!: Sprite;
    private tree!: Sprite;
    private treeAura!: Sprite;
    private treeGlows: { sprite: Sprite; base: number; phase: number }[] = [];
    private visitor!: Sprite;

    private tex!: {
        glow: Texture;
        spark: Texture;
        fade: Texture;
        mist: Texture;
        rain: Texture;
        leaf: Texture;
        ring: Texture;
        grass: Texture[];
        plants: Partial<Record<PlantId, PaintedTexture[]>>;
    };
    private heartTexture: { crowned: boolean; painted: PaintedTexture } | null = null;

    private instances: PlantInstance[] = [];
    private viewport: Viewport = { x: 0, y: 0, w: 1, h: 1 };
    private width = 1;
    private height = 1;
    private quality: Quality;
    private reducedMotion: boolean;
    private time = 0;
    private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    private weather: Record<WeatherKind, number> = { clear: 1, rain: 0, mist: 0, aurora: 0 };
    private zone: ZoneId = 'grove';
    private transition = { active: false, t: 0, swapped: false, next: 'grove' as ZoneId };
    private treePulse = 0;
    private shake = 0;
    private chiTarget = { x: 60, y: 40 };
    private spawnAcc = { firefly: 0, mote: 0, rain: 0, leaf: 0 };
    private palette!: Palette;
    private bloom: AdvancedBloomFilter | null = null;
    private lastPlants: unknown = null;
    private unsubscribe: (() => void)[] = [];
    private destroyed = false;
    private frameErrorLogged = false;

    private constructor(quality: Quality, reducedMotion: boolean) {
        this.quality = quality;
        this.reducedMotion = reducedMotion;
    }

    static async create(host: HTMLElement, quality: Quality, reducedMotion: boolean): Promise<GardenScene> {
        const scene = new GardenScene(quality, reducedMotion);
        await scene.init(host);
        return scene;
    }

    private get q() {
        return QUALITY[this.quality];
    }

    private async init(host: HTMLElement) {
        const app = new Application();
        await app.init({
            preference: 'webgl',
            resizeTo: host,
            antialias: this.quality !== 'low',
            autoDensity: true,
            resolution: Math.min(window.devicePixelRatio || 1, this.q.resolution),
            backgroundColor: 0x05070f,
            powerPreference: 'high-performance',
        });
        if (this.destroyed) {
            app.destroy(true);
            return;
        }
        this.app = app;
        app.canvas.classList.add('scene-canvas');
        app.canvas.setAttribute('aria-hidden', 'true');
        host.appendChild(app.canvas);

        this.tex = {
            glow: paintGlow(),
            spark: paintSpark(),
            fade: paintFade(),
            mist: paintMist(),
            rain: paintRain(),
            leaf: paintLeaf(),
            ring: paintRing(),
            grass: [0, 1, 2].map(paintGrass),
            plants: {},
        };
        for (const plant of PLANTS) {
            const variants = [0, 1].map((v) => paintPlant(plant.id, v)).filter((p): p is PaintedTexture => !!p);
            if (variants.length) this.tex.plants[plant.id] = variants;
        }

        this.fxLayer = new ParticleLayer(this.q.particles);
        this.ambient = new ParticleLayer(Math.round(this.q.particles * 0.4));
        this.weatherLayer = new ParticleLayer(this.q.particles);

        const stage = app.stage;
        stage.addChild(this.sky.mesh);
        stage.addChild(this.world);

        this.world.addChild(this.landscape.view);
        for (let i = 0; i < 3; i++) {
            const band = new Sprite(this.tex.fade);
            this.fogBands.push(band);
        }
        for (let i = 0; i < 2; i++) {
            const m = new TilingSprite({ texture: this.tex.mist, width: 100, height: 100 });
            m.alpha = 0;
            this.mist.push(m);
        }
        this.groundShade = new Sprite(this.tex.fade);

        this.treeAura = new Sprite(this.tex.glow);
        this.treeAura.anchor.set(0.5);
        this.treeAura.blendMode = 'add';
        this.tree = new Sprite();
        this.tree.anchor.set(0.5, 1);
        this.visitor = new Sprite(this.tex.glow);
        this.visitor.anchor.set(0.5);
        this.visitor.blendMode = 'add';
        this.visitor.alpha = 0;
        this.garden.sortableChildren = true;

        this.flash = new Sprite(Texture.WHITE);
        this.flash.alpha = 0;

        this.world.addChild(this.garden, this.grass);
        stage.addChild(this.ambient.view, this.fxLayer.view, this.weatherLayer.view, this.flash);

        this.applyQualityFilters();
        const state = useGameStore.getState();
        this.zone = state.game.zone;
        this.landscape.build(ZONE_GRADES[this.zone].terrain, this.zoneSeed(this.zone));
        this.rebuildLandscapeOrder();

        this.resize();
        app.renderer.on('resize', () => this.resize());
        app.ticker.add((ticker) => {
            try {
                this.frame(Math.min(0.05, ticker.deltaMS / 1000), Math.min(0.25, ticker.deltaMS / 1000));
            } catch (error) {
                // Never let one bad frame stop the render loop.
                if (!this.frameErrorLogged) console.error('Garden frame failed', error);
                this.frameErrorLogged = true;
            }
        });

        const onPointer = (e: PointerEvent) => {
            this.pointer.x = (e.clientX / Math.max(1, this.width)) * 2 - 1;
            this.pointer.y = (e.clientY / Math.max(1, this.height)) * 2 - 1;
        };
        window.addEventListener('pointermove', onPointer, { passive: true });
        this.unsubscribe.push(() => window.removeEventListener('pointermove', onPointer));
        this.unsubscribe.push(fx.on((e) => this.onFx(e)));

        const canvas = app.canvas;
        const onLost = (e: Event) => e.preventDefault();
        canvas.addEventListener('webglcontextlost', onLost);
        this.unsubscribe.push(() => canvas.removeEventListener('webglcontextlost', onLost));

        this.syncPlants(true);
    }

    // ------------------------------------------------------------ public API

    setViewport(v: Viewport) {
        const changed =
            Math.abs(v.x - this.viewport.x) > 1 ||
            Math.abs(v.y - this.viewport.y) > 1 ||
            Math.abs(v.w - this.viewport.w) > 1 ||
            Math.abs(v.h - this.viewport.h) > 1;
        this.viewport = v;
        if (changed && this.app) this.layout();
    }

    setChiTarget(x: number, y: number) {
        this.chiTarget = { x, y };
    }

    setQuality(quality: Quality) {
        if (quality === this.quality) return;
        this.quality = quality;
        if (!this.app) return;
        this.app.renderer.resolution = Math.min(window.devicePixelRatio || 1, this.q.resolution);
        this.applyQualityFilters();
        this.resize();
        this.syncPlants(true);
    }

    setReducedMotion(value: boolean) {
        this.reducedMotion = value;
    }

    destroy() {
        this.destroyed = true;
        this.unsubscribe.forEach((u) => u());
        this.unsubscribe = [];
        if (this.app) this.app.destroy(true, { children: true, texture: true });
    }

    // ------------------------------------------------------------ layout

    private zoneSeed(zone: ZoneId) {
        return { grove: 11, meadow: 23, hollow: 37, peaks: 53 }[zone];
    }

    private rebuildLandscapeOrder() {
        this.landscape.view.removeChildren();
        this.landscape.layers.forEach((layer, i) => {
            this.landscape.view.addChild(layer.view);
            if (i < 2) this.landscape.view.addChild(this.mist[i]);
            this.landscape.view.addChild(this.fogBands[i]);
        });
        this.landscape.view.addChild(this.groundShade);
    }

    private applyQualityFilters() {
        if (this.q.bloom) {
            this.bloom = this.bloom ?? new AdvancedBloomFilter({ threshold: 0.35, bloomScale: 0.9, brightness: 1, blur: 6, quality: 4 });
            this.fxLayer.view.filters = [this.bloom];
        } else {
            this.fxLayer.view.filters = [];
        }
    }

    private resize() {
        if (!this.app) return;
        this.width = this.app.screen.width;
        this.height = this.app.screen.height;
        this.sky.resize(this.width, this.height);
        this.flash.width = this.width + 40;
        this.flash.height = this.height + 40;
        this.flash.position.set(-20, -20);
        this.layout();
    }

    private layout() {
        const v = this.viewport;
        const w = this.width;
        this.landscape.layers.forEach((layer) => layer.draw(w, v.h, v.y));
        this.landscape.layers.forEach((layer, i) => {
            const band = this.fogBands[i];
            const baseY = v.y + v.h * layer.spec.base;
            band.width = w * 1.3;
            band.x = -w * 0.15;
            band.height = v.h * 0.16;
            band.y = baseY - v.h * 0.06;
        });
        this.mist.forEach((m, i) => {
            const layer = this.landscape.layers[i + 1];
            m.width = w * 1.3;
            m.x = -w * 0.15;
            m.height = v.h * 0.28;
            m.y = v.y + v.h * layer.spec.base - v.h * 0.2;
            m.tileScale.set(v.h / 520);
        });
        this.groundShade.width = w * 1.3;
        this.groundShade.x = -w * 0.15;
        this.groundShade.y = v.y + v.h * 0.82;
        this.groundShade.height = Math.max(this.height - this.groundShade.y, v.h * 0.2) + 40;

        this.layoutTree();
        this.layoutGrass();
        this.layoutPlants();
    }

    private treeScale() {
        const plants = useGameStore.getState().game.plants;
        const total = Object.values(plants).reduce((a, b) => a + b, 0);
        const stage = 0.5 + 0.5 * Math.min(1, Math.log10(1 + total) / Math.log10(400));
        return stage;
    }

    private layoutTree() {
        const v = this.viewport;
        const crowned = useGameStore.getState().game.plants.worldtree > 0;
        if (!this.heartTexture || this.heartTexture.crowned !== crowned) {
            this.heartTexture = { crowned, painted: paintHeartTree(crowned) };
            this.tree.texture = this.heartTexture.painted.texture;
            this.treeGlows.forEach((g) => g.sprite.destroy());
            this.treeGlows = this.heartTexture.painted.glows.map((g, i) => {
                const s = new Sprite(this.tex.glow);
                s.anchor.set(0.5);
                s.blendMode = 'add';
                s.tint = g.color;
                return { sprite: s, base: g.r / 64, phase: i * 1.7 };
            });
        }
        const painted = this.heartTexture.painted;
        const height = v.h * 0.62 * this.treeScale();
        const scale = height / painted.height;
        this.treeBaseScale = scale;
        this.tree.scale.set(scale);
        this.tree.position.set(v.x + v.w * 0.5, v.y + v.h * 0.9);
        this.tree.zIndex = this.tree.y;
        if (!this.tree.parent) this.garden.addChild(this.treeAura, this.tree, this.visitor);
        this.treeAura.position.set(this.tree.x, this.tree.y - height * 0.68);
        this.treeAura.scale.set((height * 2.6) / 128);
        this.treeAura.zIndex = this.tree.y - 1;
        this.visitor.zIndex = this.tree.y + 1;
        this.treeGlows.forEach((g, i) => {
            const anchor = painted.glows[i];
            g.sprite.position.set(this.tree.x + anchor.x * scale, this.tree.y + anchor.y * scale);
            g.sprite.zIndex = this.tree.y + 0.5;
            g.base = (anchor.r * scale * 1.5) / 128;
            if (!g.sprite.parent) this.garden.addChild(g.sprite);
        });
    }

    private layoutGrass() {
        this.grass.removeChildren().forEach((c) => c.destroy());
        const v = this.viewport;
        const rand = mulberry(77);
        const count = this.q.grass;
        for (let i = 0; i < count; i++) {
            const s = new Sprite(this.tex.grass[i % 3]);
            s.anchor.set(0.5, 1);
            const t = (i + rand() * 0.8) / count;
            s.x = v.x - v.w * 0.05 + t * v.w * 1.1;
            s.y = v.y + v.h * (1.02 + rand() * 0.03);
            const sc = (v.h / 760) * (0.7 + rand() * 0.5);
            s.scale.set(sc * (rand() > 0.5 ? 1 : -1), sc);
            (s as Sprite & { phase?: number }).phase = rand() * 10;
            this.grass.addChild(s);
        }
    }

    // ------------------------------------------------------------ plants

    private slotPosition(id: PlantId, slot: number) {
        const index = PLANTS.findIndex((p) => p.id === id);
        const rand = mulberry(index * 1000 + slot * 37 + 5);
        let x = 0.04 + rand() * 0.92;
        const big = PLANT_SCALE[id] >= 0.78;
        // Keep the heart tree clear; big trees go to the sides.
        if (x > 0.36 && x < 0.64) x = x < 0.5 ? x - 0.26 : x + 0.26;
        if (big && x > 0.25 && x < 0.75) x = x < 0.5 ? x - 0.18 : x + 0.18;
        const depth = big ? rand() * 0.45 : 0.2 + rand() * 0.8;
        return { x: Math.min(0.98, Math.max(0.02, x)), depth };
    }

    private desiredCount(level: number) {
        if (level <= 0) return 0;
        return Math.min(this.q.perPlant, 1 + Math.floor(Math.log2(level) * 1.2));
    }

    private syncPlants(silent = false) {
        if (!this.app) return;
        const plants = useGameStore.getState().game.plants;
        for (const plant of PLANTS) {
            if (!this.tex.plants[plant.id]) continue;
            const want = this.desiredCount(plants[plant.id]);
            const have = this.instances.filter((i) => i.id === plant.id);
            for (let slot = have.length; slot < want; slot++) this.addInstance(plant.id, slot, silent);
            for (const extra of have.slice(want)) this.removeInstance(extra);
        }
        this.layoutPlants();
    }

    private addInstance(id: PlantId, slot: number, silent: boolean) {
        const variants = this.tex.plants[id]!;
        const painted = variants[slot % variants.length];
        const root = new Container();
        const sprite = new Sprite(painted.texture);
        sprite.anchor.set(0.5, 1);
        root.addChild(sprite);
        const ethereal = PLANTS.find((p) => p.id === id)!.essence === 'ethereal';
        const glows = painted.glows.map((g, i) => {
            const s = new Sprite(this.tex.glow);
            s.anchor.set(0.5);
            s.blendMode = 'add';
            s.tint = g.color;
            s.position.set(g.x, g.y);
            root.addChild(s);
            return { sprite: s, base: (g.r * 2.4) / 128, phase: i * 1.3 + slot };
        });
        const inst: PlantInstance = {
            id,
            slot,
            root,
            sprite,
            glows,
            phase: slot * 1.7 + id.length,
            born: silent ? -10 : this.time,
            depth: 0,
            ethereal,
        };
        this.instances.push(inst);
        this.garden.addChild(root);
    }

    private removeInstance(inst: PlantInstance) {
        this.instances = this.instances.filter((i) => i !== inst);
        inst.root.destroy({ children: true });
    }

    private layoutPlants() {
        const v = this.viewport;
        for (const inst of this.instances) {
            const { x, depth } = this.slotPosition(inst.id, inst.slot);
            inst.depth = depth;
            const px = v.x + x * v.w;
            const py = v.y + v.h * (0.8 + depth * 0.17);
            const base = (v.h / 900) * PLANT_SCALE[inst.id] * (0.65 + depth * 0.55);
            inst.root.position.set(px, py);
            inst.root.scale.set(base * (inst.slot % 2 ? -1 : 1), base);
            inst.root.zIndex = py;
        }
    }

    private instanceFor(id: PlantId) {
        const list = this.instances.filter((i) => i.id === id);
        return list.sort((a, b) => b.born - a.born)[0];
    }

    // ------------------------------------------------------------ fx

    private onFx(e: FxEvent) {
        if (!this.app) return;
        switch (e.type) {
            case 'gather':
                this.burst(e.x, e.y, 9, [0x7ff0c0, 0xffd98a, 0xa9e8ff], 200, 0.45);
                this.homing(e.x, e.y, 3);
                this.treePulse = 1;
                break;
            case 'plantBought': {
                this.syncPlants();
                const inst = this.instanceFor(e.id);
                if (inst) {
                    const tip = inst.root.toGlobal({ x: 0, y: -inst.sprite.height * 0.5 });
                    this.burst(tip.x, tip.y, 18, [0xb6ffcf, 0xffffff, inst.ethereal ? 0xb49cff : 0xffd27a], 180);
                    this.rise(tip.x, tip.y, 6, inst.ethereal ? 0xc7b6ff : 0xffe2a0);
                }
                this.layoutTree();
                break;
            }
            case 'upgradeBought':
            case 'perkBought':
                this.rise(this.tree.x, this.tree.y - this.tree.height * 0.5, 14, 0xffe7a8);
                this.treePulse = 1;
                break;
            case 'ritual': {
                const color = RITUAL_COLORS[e.id] ?? 0xffffff;
                const cx = this.tree.x;
                const cy = this.tree.y - this.tree.height * 0.45;
                this.ring(cx, cy, color, this.viewport.h * 1.1);
                this.burst(cx, cy, 30, [color, 0xffffff], 320);
                if (e.id === 'drums') this.shake = 1;
                if (e.id === 'offering') this.rise(cx, this.viewport.y + this.viewport.h, 30, 0xfff1c2);
                this.treePulse = 1;
                break;
            }
            case 'zoneUnlocked':
            case 'travel':
                this.startTransition(e.id);
                break;
            case 'newCycle':
                this.flashTo(0xffffff, 1);
                this.syncPlants(true);
                this.layoutTree();
                break;
            case 'signal':
                if (e.signal.type === 'achievement') {
                    this.rise(this.tree.x, this.tree.y - this.tree.height * 0.6, 10, 0xffe39a);
                }
                break;
            default:
                break;
        }
    }

    private burst(x: number, y: number, count: number, colors: number[], speed: number, scale = 1) {
        const n = this.reducedMotion ? Math.ceil(count / 3) : count;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = speed * (0.35 + Math.random() * 0.65);
            this.fxLayer.spawn(
                this.tex.spark,
                {
                    x,
                    y,
                    vx: Math.cos(a) * v,
                    vy: Math.sin(a) * v - speed * 0.2,
                    maxLife: 0.6 + Math.random() * 0.6,
                    size: (0.25 + Math.random() * 0.4) * scale,
                    alpha: 0.85,
                    behaviour: behaviours.burst,
                },
                colors[i % colors.length],
            );
        }
    }

    private homing(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            this.fxLayer.spawn(
                this.tex.glow,
                {
                    x,
                    y,
                    vx: Math.cos(a) * 260,
                    vy: Math.sin(a) * 260 - 120,
                    tx: this.chiTarget.x,
                    ty: this.chiTarget.y,
                    maxLife: 1.1 + Math.random() * 0.4,
                    size: 0.13,
                    alpha: 0.8,
                    behaviour: behaviours.homing,
                },
                0x9ff7d2,
            );
        }
    }

    private rise(x: number, y: number, count: number, color: number) {
        for (let i = 0; i < count; i++) {
            this.fxLayer.spawn(
                this.tex.spark,
                {
                    x: x + (Math.random() - 0.5) * this.viewport.h * 0.3,
                    y: y + (Math.random() - 0.5) * this.viewport.h * 0.18,
                    vy: -40 - Math.random() * 80,
                    maxLife: 1.4 + Math.random() * 1.2,
                    size: 0.3 + Math.random() * 0.5,
                    behaviour: behaviours.rise,
                },
                color,
            );
        }
    }

    private ring(x: number, y: number, color: number, diameter: number) {
        this.fxLayer.spawn(
            this.tex.ring,
            { x, y, maxLife: 1.4, size: diameter / 256, alpha: 0.8, behaviour: behaviours.ring },
            color,
        );
    }

    private flashTo(color: number, strength: number) {
        this.flash.tint = color;
        this.flash.alpha = Math.max(this.flash.alpha, strength);
    }

    private startTransition(zone: ZoneId) {
        if (zone === this.zone && !this.transition.active) return;
        this.transition = { active: true, t: 0, swapped: false, next: zone };
    }

    // ------------------------------------------------------------ frame

    /** dt: simulation-smoothed step; realDt: wall clock step for UI-timed transitions. */
    private frame(dt: number, realDt: number) {
        if (!this.app || this.destroyed) return;
        this.time += dt;
        const store = useGameStore.getState();
        const game = store.game;
        const lag = Math.min(1, (performance.now() - store.tickedAt) / 1000);
        const worldTime = game.worldTime + lag;
        const day = getDayInfo(worldTime);
        const v = this.viewport;

        // Zone transition: fog flash, swap terrain at the peak.
        if (!this.transition.active && game.zone !== this.zone) this.startTransition(game.zone);
        if (this.transition.active) {
            this.transition.t += realDt;
            const t = this.transition.t;
            if (!this.transition.swapped && t >= 0.55) {
                this.zone = this.transition.next;
                this.landscape.build(ZONE_GRADES[this.zone].terrain, this.zoneSeed(this.zone));
                this.rebuildLandscapeOrder();
                this.layout();
                this.transition.swapped = true;
            }
            const a = t < 0.55 ? t / 0.55 : Math.max(0, 1 - (t - 0.55) / 1.1);
            this.flash.tint = this.palette ? this.palette.fog : 0xffffff;
            this.flash.alpha = a;
            if (t > 1.7) this.transition.active = false;
        } else if (this.flash.alpha > 0) {
            this.flash.alpha = Math.max(0, this.flash.alpha - realDt * 1.2);
        }

        // Weather intensities ease towards the active kind.
        for (const kind of Object.keys(this.weather) as WeatherKind[]) {
            this.weather[kind] = smooth(this.weather[kind], game.weather.kind === kind ? 1 : 0, 0.8, dt);
        }

        const grade = ZONE_GRADES[this.zone];
        const balanceTilt = (game.balance - 50) / 50;
        const palette = gradePalette({ phase: day.phase, zone: grade, weather: this.weather, balanceTilt });
        this.palette = palette;

        // Parallax.
        const motion = this.reducedMotion ? 0 : 1;
        this.pointer.sx = smooth(this.pointer.sx, this.pointer.x * motion, 2, dt);
        this.pointer.sy = smooth(this.pointer.sy, this.pointer.y * motion, 2, dt);
        const drift = Math.sin(this.time * 0.05) * 0.3 * motion;
        const px = this.pointer.sx + drift;
        const py = this.pointer.sy;

        // Sun & moon.
        const horizonUv = (v.y + v.h * 0.64) / this.height;
        const isMoon = day.elevation < 0;
        const arcT = isMoon ? (day.phase - 0.5) / 0.5 : day.phase / 0.5;
        const sunX = 0.08 + 0.84 * arcT;
        const arcHeight = Math.sin(arcT * Math.PI);
        const sunY = horizonUv + 0.03 - arcHeight * (horizonUv * 0.78);
        const stars = Math.min(1, Math.max(0, (-day.elevation + 0.05) * 2.5));
        const clouds =
            0.22 * this.weather.clear + 0.95 * this.weather.rain + 0.55 * this.weather.mist + 0.08 * this.weather.aurora;
        const aurora = Math.min(1, this.weather.aurora + grade.aurora * stars);
        this.sky.update({
            palette,
            sunX,
            sunY,
            moon: isMoon ? 1 : 0,
            stars: stars * (1 - this.weather.rain * 0.8),
            aurora,
            clouds,
            horizonY: horizonUv,
            time: this.time,
            parallaxX: px,
            parallaxY: py,
        });

        // Landscape tints + parallax.
        const layerColors = [palette.far, palette.mid, palette.near];
        this.landscape.layers.forEach((layer, i) => {
            layer.view.tint = layerColors[i];
            layer.view.x = -px * layer.spec.depth * 28;
            layer.view.y = -py * layer.spec.depth * 8;
            const band = this.fogBands[i];
            band.tint = palette.fog;
            band.alpha = (0.16 + 0.4 * this.weather.mist + 0.2 * this.weather.rain) * (1 - i * 0.3);
            band.x = -this.width * 0.15 + layer.view.x;
        });
        this.mist.forEach((m, i) => {
            m.tint = palette.fog;
            m.alpha = smooth(m.alpha, 0.05 + 0.7 * this.weather.mist + 0.2 * this.weather.rain, 1, dt);
            m.tilePosition.x += dt * (12 + i * 8) * (motion || 0.3);
        });
        this.groundShade.tint = palette.ground;
        this.groundShade.alpha = 0.85;

        if (game.plants !== this.lastPlants) {
            this.lastPlants = game.plants;
            this.syncPlants(true);
            this.layoutTree();
        }

        // Heart tree.
        this.treePulse = Math.max(0, this.treePulse - dt * 2.5);
        const sway = Math.sin(this.time * 0.6) * 0.012 * (1 + this.weather.rain) * (motion || 0.3);
        const pulse = 1 + this.treePulse * 0.035;
        this.tree.skew.x = sway;
        this.tree.tint = palette.light;
        this.tree.scale.set(this.treeBaseScale * pulse);
        const harmony = store.rates.harmony;
        const auraColor = mix(mix(0xffd27a, 0xb49cff, (balanceTilt + 1) / 2), 0xffffff, harmony * 0.5);
        this.treeAura.tint = auraColor;
        const night = 1 - day.daylight;
        this.treeAura.alpha = (0.05 + 0.13 * harmony) * (0.4 + 0.6 * night) + this.treePulse * 0.12;
        this.treeGlows.forEach((g) => {
            const p = 0.5 + 0.5 * Math.sin(this.time * 1.4 + g.phase);
            g.sprite.alpha = (0.12 + 0.4 * night) * (0.5 + 0.5 * p);
            g.sprite.scale.set(g.base * (0.85 + 0.3 * p));
        });

        // Visitor wisp while an event waits.
        const visitorTarget = game.activeEvent ? 1 : 0;
        this.visitor.alpha = smooth(this.visitor.alpha, visitorTarget * 0.9, 2, dt);
        if (this.visitor.alpha > 0.01) {
            const r = this.tree.height * 0.35;
            this.visitor.position.set(
                this.tree.x + Math.cos(this.time * 0.8) * r,
                this.tree.y - this.tree.height * 0.6 + Math.sin(this.time * 1.6) * r * 0.25,
            );
            this.visitor.tint = 0xbfffe9;
            this.visitor.scale.set(0.35 + 0.08 * Math.sin(this.time * 3));
            if (Math.random() < dt * 20 * this.visitor.alpha) {
                this.fxLayer.spawn(
                    this.tex.spark,
                    { x: this.visitor.x, y: this.visitor.y, vy: -10, maxLife: 1.2, size: 0.3, behaviour: behaviours.rise },
                    0xbfffe9,
                );
            }
        }

        // Plants: ambient light, sway, glow pulse, pop-in.
        for (const inst of this.instances) {
            inst.sprite.tint = palette.light;
            const age = this.time - inst.born;
            const grow = age < 0.9 ? this.elastic(age / 0.9) : 1;
            inst.sprite.scale.set(grow);
            inst.sprite.skew.x =
                Math.sin(this.time * (0.9 + inst.depth * 0.4) + inst.phase) * 0.05 * (1 + this.weather.rain * 1.5) * (motion || 0.3);
            for (const g of inst.glows) {
                const p = 0.5 + 0.5 * Math.sin(this.time * 1.8 + g.phase);
                g.sprite.alpha = (inst.ethereal ? 0.35 + 0.65 * night : 0.15 + 0.5 * night) * (0.45 + 0.55 * p) * grow;
                g.sprite.scale.set(g.base * (0.8 + 0.35 * p));
            }
        }
        for (const child of this.grass.children) {
            const s = child as Sprite & { phase?: number };
            s.tint = mix(palette.near, palette.light, 0.25);
            s.skew.x = Math.sin(this.time * 1.3 + (s.phase ?? 0)) * 0.12 * (1 + this.weather.rain) * (motion || 0.3);
        }

        this.spawnAmbient(dt, day.daylight, palette);

        // Camera shake for drums.
        if (this.shake > 0) {
            this.shake = Math.max(0, this.shake - dt * 2);
            const s = this.shake * 6 * motion;
            this.world.position.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
        } else {
            this.world.position.set(0, 0);
        }

        this.ambient.update(dt, this.time);
        this.fxLayer.update(dt, this.time);
        this.weatherLayer.update(dt, this.time);
    }

    private treeBaseScale = 1;

    private elastic(t: number) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }

    private spawnAmbient(dt: number, daylight: number, palette: Palette) {
        const v = this.viewport;
        const motionScale = this.reducedMotion ? 0.3 : 1;
        const rates = useGameStore.getState().rates;
        const etherealShare = rates.physicalRaw + rates.etherealRaw > 0 ? rates.etherealRaw / (rates.physicalRaw + rates.etherealRaw) : 0.3;

        // Fireflies at night, more with a dreamy garden.
        const night = 1 - daylight;
        const fireflyTarget = this.q.fireflies * night * (0.5 + etherealShare) * motionScale;
        this.spawnAcc.firefly += dt * fireflyTarget * 0.25;
        while (this.spawnAcc.firefly > 1 && this.ambient.count < fireflyTarget + 4) {
            this.spawnAcc.firefly -= 1;
            this.ambient.spawn(
                this.tex.glow,
                {
                    x: v.x + Math.random() * v.w,
                    y: v.y + v.h * (0.55 + Math.random() * 0.42),
                    vx: (Math.random() - 0.5) * 20,
                    vy: (Math.random() - 0.5) * 10,
                    maxLife: 6 + Math.random() * 6,
                    size: 0.1 + Math.random() * 0.08,
                    behaviour: behaviours.firefly,
                },
                Math.random() > etherealShare ? 0xe8ff9a : 0x9ff4ff,
            );
        }
        if (this.spawnAcc.firefly > 1) this.spawnAcc.firefly = 1;

        // Pollen / dust motes by day.
        this.spawnAcc.mote += dt * 3 * daylight * motionScale * (1 - this.weather.rain);
        while (this.spawnAcc.mote > 1) {
            this.spawnAcc.mote -= 1;
            this.ambient.spawn(
                this.tex.spark,
                {
                    x: v.x + Math.random() * v.w,
                    y: v.y + v.h * (0.3 + Math.random() * 0.6),
                    vx: 8 + Math.random() * 10,
                    vy: -4 - Math.random() * 6,
                    maxLife: 5 + Math.random() * 5,
                    size: 0.12 + Math.random() * 0.12,
                    alpha: 0.6,
                    behaviour: behaviours.mote,
                },
                mix(palette.accent, 0xffffff, 0.5),
            );
        }

        // Falling leaves.
        this.spawnAcc.leaf += dt * 0.35 * motionScale * (1 + this.weather.rain);
        while (this.spawnAcc.leaf > 1) {
            this.spawnAcc.leaf -= 1;
            this.ambient.spawn(
                this.tex.leaf,
                {
                    x: v.x + Math.random() * v.w,
                    y: v.y + v.h * 0.3,
                    vx: 20 + Math.random() * 20,
                    vy: 25 + Math.random() * 20,
                    spin: (Math.random() - 0.5) * 3,
                    maxLife: 8,
                    size: 0.6 + Math.random() * 0.4,
                    alpha: 0.85,
                    behaviour: behaviours.leaf,
                },
                mix(mix(0x6fae58, 0xe8b04a, Math.random()), palette.light, 0.3),
                'normal',
            );
        }

        // Rain streaks over the whole screen.
        const rain = this.weather.rain;
        if (rain > 0.02) {
            this.spawnAcc.rain += dt * rain * this.q.particles * 0.6;
            while (this.spawnAcc.rain > 1) {
                this.spawnAcc.rain -= 1;
                const speed = 900 + Math.random() * 400;
                this.weatherLayer.spawn(
                    this.tex.rain,
                    {
                        x: Math.random() * this.width * 1.2 - this.width * 0.1,
                        y: -40,
                        vx: -speed * 0.18,
                        vy: speed,
                        ty: this.height + 20,
                        maxLife: 3,
                        size: 0.4 + Math.random() * 0.5,
                        alpha: 0.25 * rain,
                        behaviour: behaviours.rain,
                    },
                    mix(palette.fog, 0xffffff, 0.5),
                    'normal',
                );
            }
        }
    }
}
