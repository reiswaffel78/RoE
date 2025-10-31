// services/audio.ts
import { Howl } from 'howler';
import { logger } from './logger';
import { getFlag } from '../utils/flags';
import { recordBootWarning } from '../utils/bootDiagnostics';

// Example audio files - these would need to be in your public folder
const MUSIC_SRC = '/audio/background_music.mp3';
const SFX_CLICK_SRC = '/audio/click.wav';

class AudioService {
    private music: Howl | null = null;
    private sfx: Record<string, Howl> = {};
    private musicVolume: number = 0.3;
    private sfxVolume: number = 0.5;
    // FIX: Renamed private properties to avoid name collision with public getter methods.
    private _isMusicMuted: boolean = false;
    private _isSfxMuted: boolean = false;
       private readonly disabled: boolean;

    constructor() {
                this.disabled = getFlag('noAudio');
        if (this.disabled) {
            recordBootWarning('Audio disabled via flag');
            return;
        }
        this.load();
    }

    private load() {
                if (this.disabled) {
            return;
        }
        try {
            this.music = new Howl({
                src: [MUSIC_SRC],
                loop: true,
                volume: this.musicVolume,
                html5: true, // For playback from local storage cache
            });

            this.sfx['click'] = new Howl({
                src: [SFX_CLICK_SRC],
                volume: this.sfxVolume,
            });
            logger.info("Audio service loaded.");
        } catch (error) {
            logger.error("Could not initialize Howler. Audio will be disabled.", { error });
        }
    }

    playMusic() {
                if (this.disabled) {
            return;
        }
        if (this.music && !this.music.playing()) {
            this.music.play();
        }
    }

    playSfx(key: string) {
        // FIX: Check the renamed private property `_isSfxMuted`.
                if (this.disabled) {
            return;
        }
        if (this.sfx[key] && !this._isSfxMuted) {
            this.sfx[key].play();
        }
    }

    setMusicVolume(volume: number) {
                if (this.disabled) {
            return;
        }
        this.musicVolume = volume;
        this.music?.volume(volume);
    }
    
    getMusicVolume = () => this.musicVolume;

    setSfxVolume(volume: number) {
                if (this.disabled) {
            return;
        }
        this.sfxVolume = volume;
        for (const key in this.sfx) {
            this.sfx[key].volume(volume);
        }
    }

    getSfxVolume = () => this.sfxVolume;

    toggleMusic(): boolean {
                if (this.disabled) {
            return true;
        }
        // FIX: Use the renamed private property `_isMusicMuted`.
        this._isMusicMuted = !this._isMusicMuted;
        this.music?.mute(this._isMusicMuted);
        return this._isMusicMuted;
    }
    
    // FIX: Public getter function. Now there's no name collision.
    isMusicMuted = () => this._isMusicMuted;

    toggleSfx(): boolean {
                if (this.disabled) {
            return true;
        }
        // FIX: Use the renamed private property `_isSfxMuted`.
        this._isSfxMuted = !this._isSfxMuted;
        // Howler doesn't have a global mute for a group of sounds, so we just track the state.
        // The playSfx method will check this flag.
        return this._isSfxMuted;
    }

    // FIX: Public getter function. Now there's no name collision.
    isSfxMuted = () => this._isSfxMuted;
}

export const audioService = new AudioService();
