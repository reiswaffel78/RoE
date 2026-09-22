// The living garden, painted as a flat atmospheric illustration: shader sky,
// layered zone silhouettes with haze, water, the tree of life and the player's
// plants. Reads the game store every frame (no React) and reacts to fx events
// with calm, understated feedback.

// Eval-free code paths: required under strict Content-Security-Policies.
import 'pixi.js/unsafe-eval';
import { Application, Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { PLANTS, getDayInfo, type PlantId, type WeatherKind, type ZoneId } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { fx, type FxEvent } from '../../store/fx';
import type { Quality } from '../../store/settingsStore';
import { mix, scale } from './color';
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
    type HeartTree,
    type PaintedTexture,
} from './flora';
import { layerColor, scenePalette, type Palette } from './palette';
import { ParticleLayer, behaviours } from './particles';
import { mulberry } from './procedural';
import { Sky } from './sky';
import { Terrain, type TerrainLayer } from './terrain';

export interface Viewport {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface PlantPick {
    id: PlantId;
    x: number;
    y: number;
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
}

const QUALITY = {
    low: { resolution: 1, particles: 140, grass: 8, perPlant: 2 },
    medium: { resolution: 1.5, particles: 320, grass: 14, perPlant: 3 },
    high: { resolution: 2, particles: 520, grass: 20, perPlant: 3 },
} as const;

const PLANT_SCALE: Record<PlantId, number> = {
    lotus: 0.5,
    fern: 0.52,
    sunpetal: 0.55,
    willow: 0.66,
    oak: 0.72,
    dreamwood: 0.72,
    emberroot: 0.55,
    starbloom: 0.62,
    worldtree: 1,
};

const smooth = (current: number, target: number, rate: number, dt: number) =>
    current + (target - current) * (1 - Math.exp(-rate * dt));

export class GardenScene {
    private app!: Application;
    private sky = new Sky();
    private world = new Container();
    private terrain = new Terrain();
    private fogBands = new Map<TerrainLayer, Sprite>();
    private mist: TilingSprite[] = [];
    private sunGlint!: Sprite;
    private garden = new Container();
    private grass = new Container();
    private fxLayer!: ParticleLayer;
    private ambient!: ParticleLayer;
    private weatherLayer!: ParticleLayer;
    private flash!: Sprite;
    private trunk!: Sprite;
    private crown!: Sprite;
    private treeAura!: Sprite;
    private visitor!: Sprite;
    private heart!: HeartTree;

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
    private treeBaseScale = 1;
    private chiTarget = { x: 60, y: 40 };
    private spawnAcc = { firefly: 0, mote: 0, rain: 0, leaf: 0, spray: 0 };
    private palette!: Palette;
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
        this.heart = paintHeartTree();

        this.fxLayer = new ParticleLayer(this.q.particles);
        this.ambient = new ParticleLayer(Math.round(this.q.particles * 0.4));
        this.weatherLayer = new ParticleLayer(this.q.particles);

        for (let i = 0; i < 2; i++) {
            const m = new TilingSprite({ texture: this.tex.mist, width: 100, height: 100 });
            m.alpha = 0;
            this.mist.push(m);
        }
        this.sunGlint = new Sprite(this.tex.glow);
        this.sunGlint.anchor.set(0.5, 0);
        this.sunGlint.blendMode = 'add';

        this.treeAura = new Sprite(this.tex.glow);
        this.treeAura.anchor.set(0.5);
        this.treeAura.blendMode = 'add';
        this.trunk = new Sprite(this.heart.trunk);
        this.trunk.anchor.set(0.5, 1);
        this.crown = new Sprite(this.heart.crown);
        this.crown.anchor.set(0.5, 1);
        this.visitor = new Sprite(this.tex.glow);
        this.visitor.anchor.set(0.5);
        this.visitor.blendMode = 'add';
        this.visitor.alpha = 0;
        this.garden.sortableChildren = true;
        this.garden.addChild(this.treeAura, this.trunk, this.crown, this.visitor);

        this.flash = new Sprite(Texture.WHITE);
        this.flash.alpha = 0;

        app.stage.addChild(this.sky.mesh, this.world);
        this.world.addChild(this.terrain.view);
        app.stage.addChild(this.ambient.view, this.fxLayer.view, this.weatherLayer.view, this.flash);

        this.zone = useGameStore.getState().game.zone;
        this.buildTerrain();
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
        this.resize();
        this.syncPlants(true);
    }

    setReducedMotion(value: boolean) {
        this.reducedMotion = value;
    }

    /** Plant under a screen point (for the hover label), if any. */
    pickPlant(x: number, y: number): PlantPick | null {
        let best: PlantInstance | null = null;
        for (const inst of this.instances) {
            const b = inst.sprite.getBounds();
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                if (!best || inst.root.zIndex > best.root.zIndex) best = inst;
            }
        }
        if (!best) return null;
        const b = best.sprite.getBounds();
        return { id: best.id, x: b.x + b.width / 2, y: b.y };
    }

    destroy() {
        this.destroyed = true;
        this.unsubscribe.forEach((u) => u());
        this.unsubscribe = [];
        if (this.app) this.app.destroy(true, { children: true, texture: true });
    }

    // ------------------------------------------------------------ layout

    private buildTerrain() {
        this.terrain.build(this.zone);
        this.fogBands.clear();
        const view = this.terrain.view;
        view.removeChildren();
        let mistIndex = 0;
        const front: TerrainLayer[] = [];
        for (const layer of this.terrain.layers) {
            // Frame silhouettes (and details on them) sit in front of the garden.
            if (layer.role === 'frame' || (layer.depth >= 1 && layer.role !== 'land')) {
                front.push(layer);
                continue;
            }
            view.addChild(layer.view);
            if (layer.fogAt !== null) {
                const band = new Sprite(this.tex.fade);
                this.fogBands.set(layer, band);
                view.addChild(band);
                if (mistIndex < this.mist.length && layer.depth < 0.5) view.addChild(this.mist[mistIndex++]);
            }
            if (layer.role === 'shimmer') view.addChild(this.sunGlint);
        }
        view.addChild(this.garden, this.grass);
        for (const layer of front) view.addChild(layer.view);
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
        this.terrain.draw({ width: this.width, vx: v.x, vy: v.y, vw: v.w, vh: v.h });
        for (const [layer, band] of this.fogBands) {
            band.width = this.width * 1.4;
            band.x = -this.width * 0.2;
            band.height = v.h * 0.14;
            band.y = v.y + v.h * (layer.fogAt ?? 0) - v.h * 0.11;
        }
        this.mist.forEach((m, i) => {
            m.width = this.width * 1.4;
            m.x = -this.width * 0.2;
            m.height = v.h * 0.3;
            m.y = v.y + v.h * (0.44 + i * 0.12);
            m.tileScale.set(v.h / 520);
        });
        this.sunGlint.visible = this.terrain.layers.some((l) => l.role === 'water');
        this.layoutTree();
        this.layoutGrass();
        this.layoutPlants();
    }

    private treeStage() {
        const plants = useGameStore.getState().game.plants;
        const total = Object.values(plants).reduce((a, b) => a + b, 0);
        return 0.55 + 0.45 * Math.min(1, Math.log10(1 + total) / Math.log10(400));
    }

    private layoutTree() {
        const v = this.viewport;
        const height = v.h * 0.36 * this.treeStage();
        const s = height / this.heart.height;
        this.treeBaseScale = s;
        const x = v.x + v.w * 0.5;
        const y = v.y + v.h * 0.9;
        for (const sprite of [this.trunk, this.crown]) {
            sprite.scale.set(s);
            sprite.position.set(x, y);
            sprite.zIndex = y;
        }
        this.crown.zIndex = y + 0.1;
        this.treeAura.position.set(x, y - height * 0.66);
        this.treeAura.scale.set((height * 2.2) / 128);
        this.treeAura.zIndex = y - 1;
        this.visitor.zIndex = y + 1;
    }

    private layoutGrass() {
        this.grass.removeChildren().forEach((c) => c.destroy());
        const v = this.viewport;
        const rand = mulberry(77);
        for (let i = 0; i < this.q.grass; i++) {
            const s = new Sprite(this.tex.grass[i % 3]);
            s.anchor.set(0.5, 1);
            const t = (i + rand() * 0.8) / this.q.grass;
            s.x = v.x - v.w * 0.05 + t * v.w * 1.1;
            s.y = v.y + v.h * (1.01 + rand() * 0.03);
            const sc = (v.h / 820) * (0.7 + rand() * 0.5);
            s.scale.set(sc * (rand() > 0.5 ? 1 : -1), sc);
            (s as Sprite & { phase?: number }).phase = rand() * 10;
            this.grass.addChild(s);
        }
    }

    // ------------------------------------------------------------ plants

    private slotPosition(id: PlantId, slot: number) {
        const index = PLANTS.findIndex((p) => p.id === id);
        const rand = mulberry(index * 1000 + slot * 37 + 5);
        let x = 0.1 + rand() * 0.8;
        if (x > 0.38 && x < 0.62) x = x < 0.5 ? x - 0.22 : x + 0.22;
        const big = PLANT_SCALE[id] >= 0.66;
        const depth = big ? rand() * 0.4 : 0.3 + rand() * 0.7;
        return { x: Math.min(0.9, Math.max(0.1, x)), depth };
    }

    private desiredCount(level: number) {
        if (level <= 0) return 0;
        return Math.min(this.q.perPlant, 1 + Math.floor(Math.log10(level) * 1.5));
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
        const glows = painted.glows.map((g, i) => {
            const s = new Sprite(this.tex.glow);
            s.anchor.set(0.5);
            s.blendMode = 'add';
            s.tint = g.color;
            s.position.set(g.x, g.y);
            root.addChild(s);
            return { sprite: s, base: (g.r * 1.6) / 128, phase: i * 1.3 + slot };
        });
        this.instances.push({ id, slot, root, sprite, glows, phase: slot * 1.7 + id.length, born: silent ? -10 : this.time, depth: 0 });
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
            const py = v.y + v.h * (0.83 + depth * 0.13);
            const base = (v.h / 1000) * PLANT_SCALE[inst.id] * (0.7 + depth * 0.4);
            inst.root.position.set(px, py);
            inst.root.scale.set(base * (inst.slot % 2 ? -1 : 1), base);
            inst.root.zIndex = py;
        }
    }

    private newestInstance(id: PlantId) {
        return this.instances.filter((i) => i.id === id).sort((a, b) => b.born - a.born)[0];
    }

    // ------------------------------------------------------------ fx (calm, understated)

    private onFx(e: FxEvent) {
        if (!this.app) return;
        switch (e.type) {
            case 'gather':
                this.ripple(e.x, e.y, 0xffffff, this.viewport.h * 0.08, 0.55);
                this.motes(e.x, e.y, 4, 0xfff6e0);
                this.homing(e.x, e.y, 2);
                this.treePulse = Math.max(this.treePulse, 0.5);
                break;
            case 'plantBought': {
                this.syncPlants();
                const inst = this.newestInstance(e.id);
                if (inst) {
                    const tip = inst.root.toGlobal({ x: 0, y: -inst.sprite.height * 0.5 });
                    this.motes(tip.x, tip.y, 8, 0xfff6e0);
                }
                this.layoutTree();
                break;
            }
            case 'upgradeBought':
            case 'perkBought':
                this.motes(this.crown.x, this.crown.y - this.crown.height * 0.6, 10, 0xfff1d0);
                this.treePulse = 1;
                break;
            case 'ritual': {
                const cx = this.crown.x;
                const cy = this.crown.y - this.crown.height * 0.55;
                this.ripple(cx, cy, 0xffffff, this.viewport.h * 0.9, 0.4);
                this.motes(cx, cy, 16, 0xfff6e0);
                this.treePulse = 1;
                break;
            }
            case 'zoneUnlocked':
            case 'travel':
                this.startTransition(e.id);
                break;
            case 'newCycle':
                this.flashTo(0xffffff, 0.9);
                this.syncPlants(true);
                this.layoutTree();
                break;
            default:
                break;
        }
    }

    private ripple(x: number, y: number, color: number, diameter: number, alpha: number) {
        const n = this.reducedMotion ? 0 : 1;
        for (let i = 0; i < n; i++) {
            this.fxLayer.spawn(this.tex.ring, { x, y, maxLife: 1.2, size: diameter / 256, alpha, behaviour: behaviours.ring }, color, 'normal');
        }
    }

    private motes(x: number, y: number, count: number, color: number) {
        const n = this.reducedMotion ? Math.ceil(count / 3) : count;
        for (let i = 0; i < n; i++) {
            this.fxLayer.spawn(
                this.tex.spark,
                {
                    x: x + (Math.random() - 0.5) * this.viewport.h * 0.08,
                    y: y + (Math.random() - 0.5) * this.viewport.h * 0.05,
                    vy: -18 - Math.random() * 30,
                    maxLife: 1.6 + Math.random() * 1.4,
                    size: 0.12 + Math.random() * 0.14,
                    alpha: 0.75,
                    behaviour: behaviours.rise,
                },
                color,
            );
        }
    }

    private homing(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            this.fxLayer.spawn(
                this.tex.spark,
                {
                    x,
                    y,
                    vx: Math.cos(a) * 160,
                    vy: Math.sin(a) * 160 - 80,
                    tx: this.chiTarget.x,
                    ty: this.chiTarget.y,
                    maxLife: 1.2,
                    size: 0.22,
                    alpha: 0.7,
                    behaviour: behaviours.homing,
                },
                0xe8fff4,
            );
        }
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

    private frame(dt: number, realDt: number) {
        if (!this.app || this.destroyed) return;
        this.time += dt;
        const store = useGameStore.getState();
        const game = store.game;
        const lag = Math.min(1, (performance.now() - store.tickedAt) / 1000);
        const day = getDayInfo(game.worldTime + lag);
        const v = this.viewport;
        const motion = this.reducedMotion ? 0 : 1;

        // Zone change: the world dissolves into haze and re-forms.
        if (!this.transition.active && game.zone !== this.zone) this.startTransition(game.zone);
        if (this.transition.active) {
            this.transition.t += realDt;
            const t = this.transition.t;
            if (!this.transition.swapped && t >= 0.7) {
                this.zone = this.transition.next;
                this.buildTerrain();
                this.layout();
                this.transition.swapped = true;
            }
            this.flash.tint = this.palette ? this.palette.haze : 0xffffff;
            this.flash.alpha = t < 0.7 ? t / 0.7 : Math.max(0, 1 - (t - 0.7) / 1.3);
            if (t > 2) this.transition.active = false;
        } else if (this.flash.alpha > 0) {
            this.flash.alpha = Math.max(0, this.flash.alpha - realDt);
        }

        if (game.plants !== this.lastPlants) {
            this.lastPlants = game.plants;
            this.syncPlants(true);
            this.layoutTree();
        }

        for (const kind of Object.keys(this.weather) as WeatherKind[]) {
            this.weather[kind] = smooth(this.weather[kind], game.weather.kind === kind ? 1 : 0, 0.6, dt);
        }
        const balanceTilt = (game.balance - 50) / 50;
        const p = scenePalette({
            zone: this.zone,
            daylight: day.daylight,
            elevation: day.elevation,
            weather: this.weather,
            balanceTilt,
        });
        this.palette = p;
        const night = 1 - day.daylight;

        // Parallax: gentle pointer response plus a slow idle drift.
        this.pointer.sx = smooth(this.pointer.sx, this.pointer.x * motion, 1.5, dt);
        this.pointer.sy = smooth(this.pointer.sy, this.pointer.y * motion, 1.5, dt);
        const px = this.pointer.sx + Math.sin(this.time * 0.04) * 0.25 * motion;
        const py = this.pointer.sy;

        // Sun and moon travel across the composition.
        const horizonUv = (v.y + v.h * 0.64) / this.height;
        const isMoon = day.elevation < 0;
        const arcT = isMoon ? (day.phase - 0.5) / 0.5 : day.phase / 0.5;
        const sunX = (v.x + v.w * (0.12 + 0.76 * arcT)) / this.width;
        const sunY = horizonUv + 0.04 - Math.sin(arcT * Math.PI) * horizonUv * 0.72;
        const stars = Math.min(1, Math.max(0, (-day.elevation + 0.05) * 2.5));
        const zoneAurora = this.zone === 'aurora' ? 0.75 : this.zone === 'dreamworld' ? 0.2 : 0;
        this.sky.update({
            palette: p,
            sunX,
            sunY,
            moon: isMoon ? 1 : 0,
            stars: stars * (1 - this.weather.rain * 0.85),
            aurora: Math.min(0.85, this.weather.aurora * 0.8 + zoneAurora * stars),
            clouds: 0.3 * this.weather.clear + 0.9 * this.weather.rain + 0.55 * this.weather.mist + 0.1 * this.weather.aurora,
            horizonY: horizonUv,
            time: this.time,
            parallaxX: px,
            parallaxY: py,
        });

        // Landscape layers: colour from atmospheric perspective, parallax, idle motion.
        const frameTone = mix(p.deep, 0x000000, 0.35);
        for (const layer of this.terrain.layers) {
            const g = layer.view;
            switch (layer.role) {
                case 'land':
                    g.tint = layerColor(p, layer.depth, this.weather.mist);
                    break;
                case 'frame':
                    g.tint = frameTone;
                    break;
                case 'water':
                    g.tint = mix(p.water, layerColor(p, layer.depth), 0.25);
                    break;
                case 'shimmer':
                    g.tint = mix(p.water, 0xffffff, 0.45);
                    g.alpha = 0.25 + 0.2 * Math.sin(this.time * 0.7 + layer.phase);
                    break;
                case 'accent':
                    g.tint = layer.depth < 0.5 ? mix(p.accent, layerColor(p, layer.depth), 0.25) : scale(p.accent, 0.85 + 0.15 * day.daylight);
                    break;
                case 'waterfall':
                    g.tint = mix(p.water, 0xffffff, 0.25);
                    g.alpha = 0.85 + 0.1 * Math.sin(this.time * 3);
                    break;
                case 'glow':
                    g.tint = this.zone === 'aurora' ? p.accent : mix(p.sun, p.skyBottom, 0.3);
                    g.alpha = this.zone === 'aurora' ? 0.55 + 0.35 * Math.sin(this.time * 0.9) : 0.9;
                    break;
            }
            g.x = -px * layer.parallax * 22;
            g.y = -py * layer.parallax * 6 + (layer.anim === 'bob' ? Math.sin(this.time * 0.35 + layer.phase) * v.h * 0.008 * (motion || 0.3) : 0);
            const band = this.fogBands.get(layer);
            if (band) {
                band.tint = p.haze;
                band.alpha = (0.55 - layer.depth * 0.45) + 0.25 * this.weather.mist + 0.15 * this.weather.rain;
                band.x = -this.width * 0.2 + g.x;
            }
        }
        this.mist.forEach((m, i) => {
            m.tint = mix(p.haze, 0xffffff, 0.2);
            m.alpha = smooth(m.alpha, 0.04 + 0.6 * this.weather.mist + 0.15 * this.weather.rain, 0.8, dt);
            m.tilePosition.x += dt * (6 + i * 5) * (motion || 0.3);
        });
        if (this.sunGlint.visible) {
            const water = this.terrain.layers.find((l) => l.role === 'water');
            this.sunGlint.x = sunX * this.width - px * 9;
            this.sunGlint.y = v.y + v.h * 0.705;
            this.sunGlint.width = v.h * 0.035;
            this.sunGlint.height = v.h * 0.09;
            this.sunGlint.tint = p.sun;
            this.sunGlint.alpha = water ? (0.12 + 0.18 * day.daylight) * (1 - this.weather.rain) * (0.8 + 0.2 * Math.sin(this.time * 1.3)) : 0;
        }

        // Tree of life.
        this.treePulse = Math.max(0, this.treePulse - dt * 1.5);
        const crowned = game.plants.worldtree > 0;
        const sway = Math.sin(this.time * 0.5) * 0.008 * (1 + this.weather.rain) * (motion || 0.3);
        const pulse = 1 + this.treePulse * 0.02;
        this.trunk.tint = mix(mix(p.deep, p.foliage, 0.35), 0xffffff, 0.15);
        this.crown.tint = crowned ? mix(p.foliage, p.accent, 0.35) : p.foliage;
        this.crown.skew.x = sway;
        this.crown.scale.set(this.treeBaseScale * pulse);
        this.trunk.scale.set(this.treeBaseScale);
        this.treeAura.tint = mix(p.sun, 0xffffff, 0.3);
        this.treeAura.alpha = (crowned ? 0.12 : 0.05) * (0.4 + 0.6 * night) + this.treePulse * 0.08;

        // Visitor: a soft wisp circles the tree while a spirit waits.
        this.visitor.alpha = smooth(this.visitor.alpha, game.activeEvent ? 0.7 : 0, 1.5, dt);
        if (this.visitor.alpha > 0.01) {
            const r = this.crown.height * 0.4;
            this.visitor.position.set(
                this.crown.x + Math.cos(this.time * 0.6) * r,
                this.crown.y - this.crown.height * 0.62 + Math.sin(this.time * 1.2) * r * 0.25,
            );
            this.visitor.tint = 0xf0fff8;
            this.visitor.scale.set(0.22 + 0.04 * Math.sin(this.time * 2));
        }

        // Plants and grass.
        for (const inst of this.instances) {
            // Plants take on the zone's atmosphere; far ones sink further into the haze.
            inst.sprite.tint = mix(p.light, p.haze, 0.3 + (1 - inst.depth) * 0.15);
            const age = this.time - inst.born;
            const grow = age < 1.2 ? this.easeOutBack(age / 1.2) : 1;
            inst.sprite.scale.set(grow);
            inst.sprite.skew.x = Math.sin(this.time * (0.7 + inst.depth * 0.3) + inst.phase) * 0.03 * (1 + this.weather.rain) * (motion || 0.3);
            for (const g of inst.glows) {
                const k = 0.5 + 0.5 * Math.sin(this.time * 1.2 + g.phase);
                g.sprite.alpha = 0.35 * night * (0.5 + 0.5 * k) * grow;
                g.sprite.scale.set(g.base * (0.85 + 0.2 * k));
            }
        }
        const grassTone = mix(p.deep, p.ground, 0.25);
        for (const child of this.grass.children) {
            const s = child as Sprite & { phase?: number };
            s.tint = grassTone;
            s.skew.x = Math.sin(this.time * 1.1 + (s.phase ?? 0)) * 0.08 * (1 + this.weather.rain) * (motion || 0.3);
        }

        this.spawnAmbient(dt, day.daylight, p);
        this.ambient.update(dt, this.time);
        this.fxLayer.update(dt, this.time);
        this.weatherLayer.update(dt, this.time);
    }

    private easeOutBack(t: number) {
        const c1 = 1.2;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    private spawnAmbient(dt: number, daylight: number, p: Palette) {
        const v = this.viewport;
        const motionScale = this.reducedMotion ? 0.3 : 1;
        const night = 1 - daylight;

        // Fireflies: few, small and slow.
        const fireflyTarget = 10 * night * motionScale * (this.zone === 'desert' ? 0.3 : 1);
        this.spawnAcc.firefly += dt * fireflyTarget * 0.2;
        while (this.spawnAcc.firefly > 1 && this.ambient.count < fireflyTarget + 3) {
            this.spawnAcc.firefly -= 1;
            this.ambient.spawn(
                this.tex.spark,
                {
                    x: v.x + Math.random() * v.w,
                    y: v.y + v.h * (0.6 + Math.random() * 0.35),
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 6,
                    maxLife: 7 + Math.random() * 6,
                    size: 0.14 + Math.random() * 0.08,
                    alpha: 0.8,
                    behaviour: behaviours.firefly,
                },
                this.zone === 'aurora' ? p.accent : 0xf3f0c0,
            );
        }
        if (this.spawnAcc.firefly > 1) this.spawnAcc.firefly = 1;

        // Dust motes drifting in the light.
        this.spawnAcc.mote += dt * 1.4 * daylight * motionScale * (1 - this.weather.rain);
        while (this.spawnAcc.mote > 1) {
            this.spawnAcc.mote -= 1;
            this.ambient.spawn(
                this.tex.spark,
                {
                    x: v.x + Math.random() * v.w,
                    y: v.y + v.h * (0.3 + Math.random() * 0.6),
                    vx: 5 + Math.random() * 6,
                    vy: -2 - Math.random() * 4,
                    maxLife: 6 + Math.random() * 5,
                    size: 0.08 + Math.random() * 0.08,
                    alpha: 0.35,
                    behaviour: behaviours.mote,
                },
                mix(p.sun, 0xffffff, 0.5),
            );
        }

        // Leaves (petals in the dreamworld) drift down now and then.
        if (this.zone !== 'desert') {
            this.spawnAcc.leaf += dt * 0.18 * motionScale * (1 + this.weather.rain);
            while (this.spawnAcc.leaf > 1) {
                this.spawnAcc.leaf -= 1;
                this.ambient.spawn(
                    this.tex.leaf,
                    {
                        x: v.x + Math.random() * v.w,
                        y: v.y + v.h * 0.25,
                        vx: 12 + Math.random() * 12,
                        vy: 18 + Math.random() * 14,
                        spin: (Math.random() - 0.5) * 2,
                        maxLife: 10,
                        size: 0.55 + Math.random() * 0.35,
                        alpha: 0.8,
                        behaviour: behaviours.leaf,
                    },
                    this.zone === 'dreamworld' ? p.accent : mix(p.deep, p.foliage, 0.5),
                    'normal',
                );
            }
        }

        // Spray at the foot of the waterfall.
        if (this.terrain.layers.some((l) => l.role === 'waterfall')) {
            this.spawnAcc.spray += dt * 5 * motionScale;
            while (this.spawnAcc.spray > 1) {
                this.spawnAcc.spray -= 1;
                this.ambient.spawn(
                    this.tex.spark,
                    {
                        x: v.x + v.w * (0.72 + Math.random() * 0.06) - this.pointer.sx * 4,
                        y: v.y + v.h * 0.73,
                        vx: (Math.random() - 0.5) * 12,
                        vy: -10 - Math.random() * 14,
                        maxLife: 2 + Math.random() * 1.5,
                        size: 0.3 + Math.random() * 0.3,
                        alpha: 0.25,
                        behaviour: behaviours.mote,
                    },
                    mix(p.water, 0xffffff, 0.5),
                    'normal',
                );
            }
        }

        // Rain: thin, quiet streaks.
        const rain = this.weather.rain;
        if (rain > 0.02) {
            this.spawnAcc.rain += dt * rain * this.q.particles * 0.5;
            while (this.spawnAcc.rain > 1) {
                this.spawnAcc.rain -= 1;
                const speed = 800 + Math.random() * 300;
                this.weatherLayer.spawn(
                    this.tex.rain,
                    {
                        x: Math.random() * this.width * 1.2 - this.width * 0.1,
                        y: -40,
                        vx: -speed * 0.12,
                        vy: speed,
                        ty: this.height + 20,
                        maxLife: 3,
                        size: 0.35 + Math.random() * 0.4,
                        alpha: 0.18 * rain,
                        behaviour: behaviours.rain,
                    },
                    mix(p.haze, 0xffffff, 0.5),
                    'normal',
                );
            }
        }
    }
}
