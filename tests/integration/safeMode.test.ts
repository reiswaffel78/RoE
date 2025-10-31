import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

const setSearchParams = (search: string) => {
    const url = new URL(window.location.href);
    url.search = search;
    window.history.replaceState({}, '', url.toString());
};

describe('safe mode flags', () => {
    beforeEach(() => {
        vi.resetModules();
        setSearchParams('?safe=1');
        window.localStorage.clear();
    });

    afterEach(() => {
        setSearchParams('');
        vi.resetModules();
    });

    it('disables Pixi and audio subsystems', async () => {
        const bootDiagnostics = await import('../../utils/bootDiagnostics');
        const warningSpy = vi.spyOn(bootDiagnostics, 'recordBootWarning');

        const { refreshFlagsCache, getFlag } = await import('../../utils/flags');
        refreshFlagsCache();

        expect(getFlag('safe')).toBe(true);
        expect(getFlag('noPixi')).toBe(true);
        expect(getFlag('noAudio')).toBe(true);

        const { initPixi } = await import('../../render/pixi/stage');
        const container = document.createElement('div');
        const app = initPixi(container);
        expect(app).toBeNull();

        const { audioService } = await import('../../services/audio');
        expect(() => audioService.playMusic()).not.toThrow();
        expect((audioService as unknown as { disabled: boolean }).disabled).toBe(true);
        expect(warningSpy).toHaveBeenCalledWith('Audio disabled via flag');

        warningSpy.mockRestore();
    });
});