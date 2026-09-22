// Meditative soundscape, fully synthesized with Web Audio (no asset files):
//  • a slow, breathing drone in the zone's key
//  • singing bowls with the inharmonic partials of real bowls and slow beating
//  • nature: wind gusts, water (lapping lake / waterfall), rain, crickets, birds
//  • understated feedback: water drops, small bowls, wind chimes, soft wood
// Everything is quiet by design; nothing should ever feel like a "ping".

import { getDayInfo, type ZoneId } from '../core';
import { fx, type FxEvent } from '../store/fx';
import { useGameStore } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const PENTATONIC = [0, 2, 4, 7, 9];

/** Tonal centre (MIDI note of the drone root) per zone. */
const ZONE_KEY: Record<ZoneId, number> = {
    grove: 38, // D
    desert: 33, // A
    rainforest: 41, // F
    mountains: 40, // E
    aurora: 36, // C
    dreamworld: 43, // G
};

/** Partial ratios and relative amplitudes of a Tibetan singing bowl. */
const BOWL_PARTIALS: [number, number][] = [
    [1, 1],
    [2.71, 0.5],
    [5.02, 0.26],
    [8.01, 0.12],
    [11.6, 0.06],
];

interface ZoneSound {
    wind: number;
    water: 'none' | 'lake' | 'fall';
    birds: number;
    crickets: number;
    shimmer: number;
}

const ZONE_SOUND: Record<ZoneId, ZoneSound> = {
    grove: { wind: 0.035, water: 'lake', birds: 0.1, crickets: 0.4, shimmer: 0 },
    desert: { wind: 0.07, water: 'none', birds: 0, crickets: 0.15, shimmer: 0 },
    rainforest: { wind: 0.025, water: 'fall', birds: 0.16, crickets: 0.5, shimmer: 0 },
    mountains: { wind: 0.08, water: 'none', birds: 0.03, crickets: 0.1, shimmer: 0 },
    aurora: { wind: 0.045, water: 'lake', birds: 0, crickets: 0.2, shimmer: 0.3 },
    dreamworld: { wind: 0.03, water: 'none', birds: 0, crickets: 0, shimmer: 0.6 },
};

class AudioEngine {
    private ctx: AudioContext | null = null;
    private master!: GainNode;
    private music!: GainNode;
    private nature!: GainNode;
    private sfx!: GainNode;
    private reverb!: ConvolverNode;
    private noise!: AudioBuffer;
    private droneVoices: { osc: OscillatorNode; gain: GainNode; ratio: number }[] = [];
    private droneFilter!: BiquadFilterNode;
    private droneGain!: GainNode;
    private breathGain!: GainNode;
    private windGain!: GainNode;
    private windFilter!: BiquadFilterNode;
    private waterGain!: GainNode;
    private waterFilter!: BiquadFilterNode;
    private fallGain!: GainNode;
    private rainGain!: GainNode;
    private zone: ZoneId = 'grove';
    private lastDrop = 0;
    private timers: number[] = [];
    private unsubscribe: (() => void)[] = [];

    /** Must be called from a user gesture (autoplay policy). */
    unlock() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') void this.ctx.resume();
            return;
        }
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        try {
            this.ctx = new Ctor();
        } catch {
            return;
        }
        this.build();
    }

    // ------------------------------------------------------------ graph

    private build() {
        const ctx = this.ctx!;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -14;
        limiter.ratio.value = 4;
        limiter.attack.value = 0.01;
        limiter.release.value = 0.4;
        limiter.connect(ctx.destination);
        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(limiter);

        // A long, dark hall: filtered, exponentially decaying noise.
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = this.impulse(6, 2.6);
        const wet = ctx.createGain();
        wet.gain.value = 0.7;
        const wetTone = ctx.createBiquadFilter();
        wetTone.type = 'lowpass';
        wetTone.frequency.value = 4200;
        this.reverb.connect(wetTone).connect(wet).connect(this.master);

        this.music = ctx.createGain();
        this.nature = ctx.createGain();
        this.sfx = ctx.createGain();
        for (const bus of [this.music, this.nature, this.sfx]) bus.connect(this.master);
        const send = (bus: GainNode, amount: number) => {
            const g = ctx.createGain();
            g.gain.value = amount;
            bus.connect(g).connect(this.reverb);
        };
        send(this.music, 0.6);
        send(this.sfx, 0.55);
        send(this.nature, 0.15);

        this.noise = this.noiseBuffer(6);
        this.buildDrone();
        this.buildNature();

        this.zone = useGameStore.getState().game.zone;
        this.applyZone(true);
        this.applyVolumes();
        this.timers.push(window.setInterval(() => this.ambience(), 500));
        this.timers.push(window.setInterval(() => this.breathe(), 6000));
        this.scheduleBowl();
        this.unsubscribe.push(fx.on((e) => this.onFx(e)));
        this.unsubscribe.push(useSettings.subscribe(() => this.applyVolumes()));
        // Fade the whole world in gently.
        this.master.gain.setTargetAtTime(this.masterLevel(), ctx.currentTime, 1.5);
    }

    private masterLevel() {
        return useSettings.getState().muted ? 0 : 0.9;
    }

    private applyVolumes() {
        if (!this.ctx) return;
        const s = useSettings.getState();
        const t = this.ctx.currentTime;
        this.master.gain.setTargetAtTime(this.masterLevel(), t, 0.2);
        this.music.gain.setTargetAtTime(s.musicVolume * 0.9, t, 0.4);
        this.nature.gain.setTargetAtTime(s.musicVolume * 1.1, t, 0.4);
        this.sfx.gain.setTargetAtTime(s.sfxVolume * 0.7, t, 0.08);
    }

    private impulse(seconds: number, decay: number) {
        const ctx = this.ctx!;
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = buffer.getChannelData(c);
            let low = 0;
            for (let i = 0; i < length; i++) {
                low = low * 0.6 + (Math.random() * 2 - 1) * 0.4;
                data[i] = low * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    }

    private noiseBuffer(seconds: number) {
        const ctx = this.ctx!;
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        // Pink-ish noise (Paul Kellet's economy filter).
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99765 * b0 + white * 0.099046;
            b1 = 0.963 * b1 + white * 0.2965164;
            b2 = 0.57 * b2 + white * 1.0526913;
            data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
        }
        return buffer;
    }

    private loop(filter: AudioNode, rate = 1) {
        const src = this.ctx!.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        src.playbackRate.value = rate;
        src.connect(filter);
        src.start(0, Math.random() * 5);
        return src;
    }

    private panner(pan: number): AudioNode {
        const ctx = this.ctx!;
        if (typeof ctx.createStereoPanner !== 'function') return ctx.createGain();
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        return p;
    }

    // ------------------------------------------------------------ drone

    private buildDrone() {
        const ctx = this.ctx!;
        this.droneFilter = ctx.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.value = 520;
        this.droneFilter.Q.value = 0.3;
        this.droneGain = ctx.createGain();
        this.droneGain.gain.value = 0.11;
        this.droneFilter.connect(this.droneGain).connect(this.music);
        // Root, fifth, octave and a faint tenth: an open, calm chord.
        const voices: [number, OscillatorType, number, number][] = [
            [1, 'sine', 0.55, -3],
            [1.5, 'sine', 0.3, 2],
            [2, 'triangle', 0.14, -1],
            [2.5, 'sine', 0.05, 3],
        ];
        for (const [ratio, type, level, detune] of voices) {
            const osc = ctx.createOscillator();
            osc.type = type;
            osc.detune.value = detune;
            const gain = ctx.createGain();
            gain.gain.value = level;
            // Each voice swells on its own slow cycle.
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 0.03 + Math.random() * 0.04;
            lfoGain.gain.value = level * 0.45;
            lfo.connect(lfoGain).connect(gain.gain);
            lfo.start();
            osc.connect(gain).connect(this.droneFilter);
            osc.start();
            this.droneVoices.push({ osc, gain, ratio });
        }
        // Breath: band-passed noise that swells like a slow inhale/exhale.
        const breathFilter = ctx.createBiquadFilter();
        breathFilter.type = 'bandpass';
        breathFilter.frequency.value = 380;
        breathFilter.Q.value = 0.7;
        this.breathGain = ctx.createGain();
        this.breathGain.gain.value = 0;
        breathFilter.connect(this.breathGain).connect(this.music);
        this.loop(breathFilter, 0.8);
    }

    private breathe() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        this.breathGain.gain.cancelScheduledValues(t);
        this.breathGain.gain.setTargetAtTime(0.018, t, 1.4);
        this.breathGain.gain.setTargetAtTime(0.004, t + 3, 1.6);
    }

    // ------------------------------------------------------------ nature

    private buildNature() {
        const ctx = this.ctx!;
        this.windFilter = ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.value = 500;
        this.windFilter.Q.value = 0.8;
        this.windGain = ctx.createGain();
        this.windGain.gain.value = 0;
        this.windFilter.connect(this.windGain).connect(this.nature);
        this.loop(this.windFilter, 0.6);

        // Lapping water: a narrow band that "babbles" by jumping around quickly.
        this.waterFilter = ctx.createBiquadFilter();
        this.waterFilter.type = 'bandpass';
        this.waterFilter.frequency.value = 900;
        this.waterFilter.Q.value = 6;
        this.waterGain = ctx.createGain();
        this.waterGain.gain.value = 0;
        this.waterFilter.connect(this.waterGain).connect(this.nature);
        this.loop(this.waterFilter, 1.1);

        // Waterfall: steady, soft broadband roar.
        const fallFilter = ctx.createBiquadFilter();
        fallFilter.type = 'lowpass';
        fallFilter.frequency.value = 2200;
        this.fallGain = ctx.createGain();
        this.fallGain.gain.value = 0;
        fallFilter.connect(this.fallGain).connect(this.nature);
        this.loop(fallFilter, 1.4);

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'highpass';
        rainFilter.frequency.value = 1800;
        this.rainGain = ctx.createGain();
        this.rainGain.gain.value = 0;
        rainFilter.connect(this.rainGain).connect(this.nature);
        this.loop(rainFilter, 1.6);
    }

    private applyZone(instant = false) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const tau = instant ? 0.01 : 3;
        const root = midi(ZONE_KEY[this.zone]);
        for (const v of this.droneVoices) v.osc.frequency.setTargetAtTime(root * v.ratio, t, tau);
        const sound = ZONE_SOUND[this.zone];
        this.waterGain.gain.setTargetAtTime(sound.water === 'lake' ? 0.03 : sound.water === 'fall' ? 0.02 : 0, t, tau);
        this.fallGain.gain.setTargetAtTime(sound.water === 'fall' ? 0.05 : 0, t, tau);
    }

    private ambience() {
        if (!this.ctx) return;
        const { game } = useGameStore.getState();
        if (game.zone !== this.zone) {
            this.zone = game.zone;
            this.applyZone();
            this.rubbedBowl(midi(ZONE_KEY[this.zone] + 24), 0.07);
        }
        const t = this.ctx.currentTime;
        const sound = ZONE_SOUND[this.zone];
        const day = getDayInfo(game.worldTime);
        const rain = game.weather.kind === 'rain';

        // Wind gusts: wander towards a new target now and then.
        if (Math.random() < 0.18) {
            const gust = sound.wind * (0.5 + Math.random() * (game.weather.kind === 'mist' ? 0.8 : 1.1));
            this.windGain.gain.setTargetAtTime(gust, t, 2.2);
            this.windFilter.frequency.setTargetAtTime(280 + Math.random() * 600, t, 2.5);
        }
        this.waterFilter.frequency.setTargetAtTime(600 + Math.random() * 1400, t, 0.06);
        this.rainGain.gain.setTargetAtTime(rain ? 0.045 : 0, t, 2);

        // The drone darkens and softens at night.
        this.droneFilter.frequency.setTargetAtTime(day.night ? 360 : 560, t, 4);
        this.droneGain.gain.setTargetAtTime(day.night ? 0.085 : 0.11, t, 4);

        if (!rain && day.night && Math.random() < sound.crickets * 0.5) this.cricket();
        if (!rain && !day.night && Math.random() < sound.birds * 0.25) this.bird();
        if (sound.shimmer && Math.random() < sound.shimmer * 0.04) this.chimes(2, 0.012);
    }

    private cricket() {
        const ctx = this.ctx!;
        const t = ctx.currentTime + Math.random() * 0.3;
        const freq = 4300 + Math.random() * 500;
        const out = this.panner((Math.random() - 0.5) * 1.6);
        out.connect(this.nature);
        const pulses = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < pulses; i++) {
            const start = t + i * 0.09;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.0035, start + 0.012);
            gain.gain.linearRampToValueAtTime(0, start + 0.05);
            osc.connect(gain).connect(out);
            osc.start(start);
            osc.stop(start + 0.06);
        }
    }

    private bird() {
        const ctx = this.ctx!;
        const t = ctx.currentTime;
        const out = this.panner((Math.random() - 0.5) * 1.8);
        out.connect(this.nature);
        const base = 2200 + Math.random() * 1400;
        const syllables = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < syllables; i++) {
            const start = t + i * (0.12 + Math.random() * 0.06);
            const osc = ctx.createOscillator();
            const vib = ctx.createOscillator();
            const vibGain = ctx.createGain();
            const gain = ctx.createGain();
            const f = base * (0.9 + Math.random() * 0.25);
            osc.frequency.setValueAtTime(f, start);
            osc.frequency.exponentialRampToValueAtTime(f * (Math.random() > 0.5 ? 1.25 : 0.8), start + 0.09);
            vib.frequency.value = 28 + Math.random() * 12;
            vibGain.gain.value = f * 0.03;
            vib.connect(vibGain).connect(osc.frequency);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.006, start + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
            osc.connect(gain).connect(out);
            osc.start(start);
            vib.start(start);
            osc.stop(start + 0.12);
            vib.stop(start + 0.12);
        }
    }

    // ------------------------------------------------------------ instruments

    /** Struck singing bowl: inharmonic partials, each a slowly beating pair. */
    private bowl(freq: number, volume: number, decay: number, start = this.ctx!.currentTime, pan = 0, bus = this.sfx) {
        const ctx = this.ctx!;
        const out = this.panner(pan);
        const tone = ctx.createBiquadFilter();
        tone.type = 'lowpass';
        tone.frequency.value = 3200;
        out.connect(tone).connect(bus);
        BOWL_PARTIALS.forEach(([ratio, amp], i) => {
            const f = freq * ratio;
            if (f > 9000) return;
            const tau = decay / (1 + i * 0.9);
            const beat = 0.5 + i * 0.7 + Math.random() * 0.4;
            for (const shift of [-beat / 2, beat / 2]) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = f + shift;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(volume * amp * 0.5, start + 0.006 + i * 0.002);
                gain.gain.setTargetAtTime(0, start + 0.02, tau / 3);
                osc.connect(gain).connect(out);
                osc.start(start);
                osc.stop(start + tau * 2.2 + 0.1);
            }
        });
        // Soft mallet contact.
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = Math.min(6000, freq * 3);
        bp.Q.value = 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(volume * 0.25, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
        src.connect(bp).connect(g).connect(out);
        src.start(start, Math.random() * 3, 0.06);
    }

    /** Rim-rubbed bowl: the tone swells in slowly and sings. */
    private rubbedBowl(freq: number, volume: number) {
        const ctx = this.ctx!;
        const t = ctx.currentTime;
        const out = ctx.createGain();
        out.connect(this.music);
        BOWL_PARTIALS.slice(0, 3).forEach(([ratio, amp], i) => {
            for (const shift of [-0.4 - i * 0.3, 0.4 + i * 0.3]) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = freq * ratio + shift;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(volume * amp * 0.5, t + 2.2);
                gain.gain.setTargetAtTime(0, t + 3.2, 2.2);
                osc.connect(gain).connect(out);
                osc.start(t);
                osc.stop(t + 12);
            }
        });
    }

    /** A water drop: a sine that "plops" upwards. Used for gathering chi. */
    private drop(volume: number) {
        const ctx = this.ctx!;
        const t = ctx.currentTime;
        const out = this.panner((Math.random() - 0.5) * 0.6);
        out.connect(this.sfx);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const f = 520 + Math.random() * 380;
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.07);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(gain).connect(out);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    /** Wind chimes: a few light, random pentatonic bars. */
    private chimes(count: number, volume: number) {
        const ctx = this.ctx!;
        const root = ZONE_KEY[this.zone] + 48;
        for (let i = 0; i < count; i++) {
            const start = ctx.currentTime + i * (0.12 + Math.random() * 0.25);
            const note = root + PENTATONIC[Math.floor(Math.random() * 5)] + (Math.random() > 0.6 ? 12 : 0);
            const f = midi(note);
            const out = this.panner((Math.random() - 0.5) * 1.4);
            out.connect(this.sfx);
            for (const [ratio, amp, dur] of [[1, 1, 2.4], [2.76, 0.3, 0.9], [5.4, 0.12, 0.4]] as const) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = f * ratio;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(volume * amp, start + 0.004);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
                osc.connect(gain).connect(out);
                osc.start(start);
                osc.stop(start + dur + 0.05);
            }
        }
    }

    /** Frame drum: a warm, low, felted heartbeat. */
    private frameDrum(start: number, volume: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(92, start);
        osc.frequency.exponentialRampToValueAtTime(48, start + 0.3);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
        osc.connect(gain).connect(this.sfx);
        osc.start(start);
        osc.stop(start + 0.75);
    }

    /** Muted wooden knock for "not now" – barely there. */
    private knock() {
        const ctx = this.ctx!;
        const t = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 700;
        bp.Q.value = 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
        src.connect(bp).connect(g).connect(this.sfx);
        src.start(t, Math.random() * 3, 0.1);
    }

    /** Every so often a distant bowl sounds on its own — the only "melody". */
    private scheduleBowl() {
        const wait = 22_000 + Math.random() * 30_000;
        this.timers.push(
            window.setTimeout(() => {
                if (this.ctx) {
                    const note = ZONE_KEY[this.zone] + 24 + PENTATONIC[Math.floor(Math.random() * 5)];
                    this.bowl(midi(note), 0.05, 9, this.ctx.currentTime, (Math.random() - 0.5) * 1.2, this.music);
                }
                this.scheduleBowl();
            }, wait),
        );
    }

    private note(step: number, octave = 2) {
        return midi(ZONE_KEY[this.zone] + 12 * octave + PENTATONIC[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5));
    }

    private onFx(e: FxEvent) {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const t = this.ctx.currentTime;
        switch (e.type) {
            case 'gather': {
                // Rapid tapping gets quieter instead of piling up.
                const since = t - this.lastDrop;
                this.lastDrop = t;
                this.drop(since < 0.12 ? 0.04 : 0.075);
                break;
            }
            case 'plantBought':
                this.bowl(this.note(2 + Math.floor(Math.random() * 3), 3), 0.1, 4, t, (Math.random() - 0.5) * 0.6);
                break;
            case 'upgradeBought':
            case 'perkBought':
                this.bowl(this.note(0, 3), 0.07, 5, t, -0.3);
                this.bowl(this.note(3, 3), 0.06, 5, t + 0.35, 0.3);
                break;
            case 'ritual':
                if (e.id === 'drums') {
                    [0, 0.55, 1.1, 1.4, 1.95].forEach((d, i) => this.frameDrum(t + d, i === 3 ? 0.18 : 0.26));
                } else {
                    this.bowl(this.note(0, 1), 0.16, 11, t);
                    if (e.id === 'offering' || e.id === 'vigil') this.chimes(3, 0.02);
                }
                break;
            case 'zoneUnlocked':
            case 'newCycle':
                this.bowl(this.note(0, 1), 0.14, 12, t);
                this.chimes(4, 0.02);
                break;
            case 'denied':
                this.knock();
                break;
            case 'eventResolved':
                this.bowl(this.note(4, 3), 0.06, 5, t);
                break;
            case 'signal':
                if (e.signal.type === 'achievement') this.chimes(4, 0.028);
                else if (e.signal.type === 'event') this.chimes(5, 0.018);
                break;
            default:
                break;
        }
    }

    destroy() {
        this.timers.forEach((id) => {
            window.clearInterval(id);
            window.clearTimeout(id);
        });
        this.unsubscribe.forEach((u) => u());
        void this.ctx?.close();
        this.ctx = null;
    }
}

export const audio = new AudioEngine();
