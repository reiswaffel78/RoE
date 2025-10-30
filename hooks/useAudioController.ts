// hooks/useAudioController.ts
import { useState, useEffect } from 'react';
import { audioService } from '../services/audio';

const useAudioController = () => {
    const [musicVolume, setMusicVolumeState] = useState(audioService.getMusicVolume());
    const [sfxVolume, setSfxVolumeState] = useState(audioService.getSfxVolume());
    const [isMusicMuted, setIsMusicMuted] = useState(audioService.isMusicMuted());
    const [isSfxMuted, setIsSfxMuted] = useState(audioService.isSfxMuted());

    useEffect(() => {
        audioService.setMusicVolume(musicVolume);
    }, [musicVolume]);

    useEffect(() => {
        audioService.setSfxVolume(sfxVolume);
    }, [sfxVolume]);

    const setMusicVolume = (vol: number) => {
        setMusicVolumeState(vol);
    };

    const setSfxVolume = (vol: number) => {
        setSfxVolumeState(vol);
    };
    
    const toggleMusic = () => {
        const muted = audioService.toggleMusic();
        setIsMusicMuted(muted);
    };
    
    const toggleSfx = () => {
        const muted = audioService.toggleSfx();
        setIsSfxMuted(muted);
    };

    return {
        musicVolume,
        sfxVolume,
        isMusicMuted,
        isSfxMuted,
        setMusicVolume,
        setSfxVolume,
        toggleMusic,
        toggleSfx,
    };
};

export default useAudioController;
