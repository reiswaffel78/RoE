// Procedural soundscape (Web Audio, no asset files): a slowly evolving
// pentatonic pad that follows balance and time of day, wind, rain, night
// crickets and day birds, plus synthesized UI sounds.

import { getDayInfo } from '../core';
import { fx, type FxEvent } from '../store/fx';
import { useGameStore } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';

const PENTATONIC = [0, 2, 4, 7, 9];
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class AudioEngine {
    private ctx: AudioContext | null = null;
    private master!: GainNode;
    private music!: GainNode;
    private sfx!: GainNode;
    private reverb!: ConvolverNode;
    private padVoices: { osc: OscillatorNode; gain: GainNode }[] = [];
    private padFilter!: BiquadFilterNode;
    private windGain!: GainNode;
    private windFilter!: BiquadFilterNode;
    private rainGain!: GainNode;
    private noise!: AudioBuffer;
    private chordIndex = 0;
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

    private build() {
        const ctx = this.ctx!;
        this.master = ctx.createGain();
        this.master.connect(ctx.destination);
        this.music = ctx.createGain();
        this.sfx = ctx.createGain();
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = this.impulse(3.2, 2.4);
        const wet = ctx.createGain();
        wet.gain.value = 0.55;
        this.reverb.connect(wet).connect(this.master);
        this.music.connect(this.master);
        this.music.connect(this.reverb);
        this.sfx.connect(this.master);
        this.sfx.connect(this.reverb);

        this.noise = this.noiseBuffer(4);

        // Pad: four detuned triangle/sine voices through a gentle low-pass.
        this.padFilter = ctx.createBiquadFilter();
        this.padFilter.type = 'lowpass';
        this.padFilter.frequency.value = 900;
        this.padFilter.Q.value = 0.4;
        const padGain = ctx.createGain();
        padGain.gain.value = 0.16;
        this.padFilter.connect(padGain).connect(this.music);
        for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            osc.type = i % 2 ? 'sine' : 'triangle';
            osc.detune.value = (i - 1.5) * 6;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            osc.connect(gain).connect(this.padFilter);
            osc.start();
            this.padVoices.push({ osc, gain });
        }
        // Slow filter LFO for breathing movement.
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 260;
        lfo.connect(lfoGain).connect(this.padFilter.frequency);
        lfo.start();

        // Wind: looped noise through a wandering band-pass.
        const wind = ctx.createBufferSource();
        wind.buffer = this.noise;
        wind.loop = true;
        this.windFilter = ctx.createBiquadFilter();
        this.windFilter.type = 'bandpass';
        this.windFilter.frequency.value = 500;
        this.windFilter.Q.value = 0.8;
        this.windGain = ctx.createGain();
        this.windGain.gain.value = 0.035;
        wind.connect(this.windFilter).connect(this.windGain).connect(this.music);
        wind.start();

        // Rain: bright filtered noise, faded in with the weather.
        const rain = ctx.createBufferSource();
        rain.buffer = this.noise;
        rain.loop = true;
        rain.playbackRate.value = 1.3;
        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'highpass';
        rainFilter.frequency.value = 1400;
        this.rainGain = ctx.createGain();
        this.rainGain.gain.value = 0;
        rain.connect(rainFilter).connect(this.rainGain).connect(this.music);
        rain.start();

        this.applyVolumes();
        this.nextChord();
        this.timers.push(window.setInterval(() => this.nextChord(), 11000));
        this.timers.push(window.setInterval(() => this.ambience(), 700));
        this.unsubscribe.push(fx.on((e) => this.onFx(e)));
        this.unsubscribe.push(useSettings.subscribe(() => this.applyVolumes()));
    }

    private applyVolumes() {
        if (!this.ctx) return;
        const s = useSettings.getState();
        const t = this.ctx.currentTime;
        this.master.gain.setTargetAtTime(s.muted ? 0 : 0.9, t, 0.1);
        this.music.gain.setTargetAtTime(s.musicVolume * 0.9, t, 0.3);
        this.sfx.gain.setTargetAtTime(s.sfxVolume * 0.8, t, 0.05);
    }

    private impulse(seconds: number, decay: number) {
        const ctx = this.ctx!;
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
            const data = buffer.getChannelData(c);
            for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
        return buffer;
    }

    private noiseBuffer(seconds: number) {
        const ctx = this.ctx!;
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < length; i++) {
            // Slightly pinkened noise.
            last = 0.97 * last + 0.03 * (Math.random() * 2 - 1);
            data[i] = last * 6 + (Math.random() * 2 - 1) * 0.15;
        }
        return buffer;
    }

    /** Root follows balance: earthy gardens sound lower, dreamy ones brighter. */
    private rootNote() {
        const balance = useGameStore.getState().game.balance;
        return 45 + Math.round(((balance - 50) / 50) * 2);
    }

    private nextChord() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const root = this.rootNote();
        const progressions = [
            [0, 2, 4, 7],
            [2, 4, 7, 9],
            [4, 7, 9, 12],
            [0, 4, 7, 9],
        ];
        const chord = progressions[this.chordIndex % progressions.length];
        this.chordIndex++;
        const night = getDayInfo(useGameStore.getState().game.worldTime).night;
        this.padVoices.forEach((v, i) => {
            const degree = chord[i];
            const octave = Math.floor(degree / 5);
            const note = root + 12 * (octave + (i > 1 ? 1 : 0)) + PENTATONIC[degree % 5];
            v.osc.frequency.setTargetAtTime(midi(note), t, 1.6);
            v.gain.gain.setTargetAtTime(i === 0 ? 0.32 : 0.2, t, 2.5);
        });
        this.padFilter.frequency.setTargetAtTime(night ? 650 : 1100, t, 3);
    }

    private ambience() {
        if (!this.ctx) return;
        const { game } = useGameStore.getState();
        const t = this.ctx.currentTime;
        const day = getDayInfo(game.worldTime);
        const rain = game.weather.kind === 'rain';
        this.rainGain.gain.setTargetAtTime(rain ? 0.05 : 0, t, 1.5);
        this.windFilter.frequency.setTargetAtTime(300 + Math.random() * 700, t, 2);
        this.windGain.gain.setTargetAtTime(0.02 + Math.random() * 0.03 + (game.weather.kind === 'mist' ? 0.02 : 0), t, 2);
        if (!rain && day.night && Math.random() < 0.35) this.cricket();
        if (!rain && !day.night && Math.random() < 0.08) this.bird();
    }

    private cricket() {
        const ctx = this.ctx!;
        const t = ctx.currentTime + Math.random() * 0.5;
        const freq = 4200 + Math.random() * 600;
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t + i * 0.07);
            gain.gain.linearRampToValueAtTime(0.008, t + i * 0.07 + 0.01);
            gain.gain.linearRampToValueAtTime(0, t + i * 0.07 + 0.045);
            osc.connect(gain).connect(this.music);
            osc.start(t + i * 0.07);
            osc.stop(t + i * 0.07 + 0.06);
        }
    }

    private bird() {
        const ctx = this.ctx!;
        const t = ctx.currentTime;
        const notes = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < notes; i++) {
            const start = t + i * 0.13;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const base = 2400 + Math.random() * 1400;
            osc.frequency.setValueAtTime(base, start);
            osc.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), start + 0.08);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.012, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
            osc.connect(gain).connect(this.music);
            osc.start(start);
            osc.stop(start + 0.12);
        }
    }

    // ------------------------------------------------------------ sfx

    private tone(freq: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain).connect(this.sfx);
        osc.start(start);
        osc.stop(start + duration + 0.05);
    }

    private bell(note: number, start: number, volume = 0.12) {
        const f = midi(note);
        this.tone(f, start, 1.6, volume);
        this.tone(f * 2.76, start, 0.6, volume * 0.25);
        this.tone(f * 5.4, start, 0.3, volume * 0.1);
    }

    private pentatonic(step: number) {
        const root = this.rootNote() + 24;
        return root + PENTATONIC[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5);
    }

    private onFx(e: FxEvent) {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const t = this.ctx.currentTime;
        switch (e.type) {
            case 'gather':
                this.tone(midi(this.pentatonic(Math.floor(Math.random() * 7))), t, 0.5, 0.09, 'triangle');
                break;
            case 'plantBought':
                this.bell(this.pentatonic(2), t, 0.1);
                this.bell(this.pentatonic(4), t + 0.09, 0.08);
                break;
            case 'upgradeBought':
            case 'perkBought':
                [0, 2, 4, 5].forEach((s, i) => this.bell(this.pentatonic(s + 2), t + i * 0.08, 0.08));
                break;
            case 'ritual':
                if (e.id === 'drums') {
                    for (let i = 0; i < 4; i++) this.drum(t + i * 0.22, i === 3 ? 0.5 : 0.3);
                } else {
                    this.gong(t, e.id === 'grounding' ? 0.8 : 1);
                }
                break;
            case 'zoneUnlocked':
            case 'travel':
                [0, 1, 2, 3, 4, 5].forEach((s, i) => this.bell(this.pentatonic(s), t + i * 0.1, 0.06));
                break;
            case 'newCycle':
                [0, 2, 4, 5, 7, 9].forEach((s, i) => this.bell(this.pentatonic(s), t + i * 0.18, 0.09));
                break;
            case 'denied':
                this.tone(160, t, 0.18, 0.05, 'sine');
                break;
            case 'eventResolved':
                this.bell(this.pentatonic(5), t, 0.08);
                break;
            case 'signal':
                if (e.signal.type === 'achievement') {
                    [0, 2, 4, 7].forEach((s, i) => this.bell(this.pentatonic(s + 3), t + i * 0.11, 0.09));
                } else if (e.signal.type === 'event') {
                    for (let i = 0; i < 6; i++) this.tone(midi(this.pentatonic(8 + i)), t + i * 0.06, 0.8, 0.03);
                }
                break;
        }
    }

    private gong(start: number, pitch: number) {
        const base = 98 * pitch;
        [1, 2.01, 2.76, 4.1].forEach((ratio, i) => this.tone(base * ratio, start, 3.5 - i * 0.6, 0.09 / (i + 1)));
    }

    private drum(start: number, volume: number) {
        const ctx = this.ctx!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, start);
        osc.frequency.exponentialRampToValueAtTime(52, start + 0.25);
        gain.gain.setValueAtTime(volume * 0.5, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.connect(gain).connect(this.sfx);
        osc.start(start);
        osc.stop(start + 0.45);
    }

    destroy() {
        this.timers.forEach((id) => window.clearInterval(id));
        this.unsubscribe.forEach((u) => u());
        void this.ctx?.close();
        this.ctx = null;
    }
}

export const audio = new AudioEngine();
