import { describe, expect, it } from 'vitest';
import { runBot } from './pacingBot';

const active = (t: number) => (t < 1800 ? 3 : 0);
const minutes = (s: number) => (s / 60).toFixed(1);

describe('pacing (headless bot, PDR §30 corridors)', () => {
    const run = runBot({ seconds: 4 * 3600, clicksPerSecond: active });
    const at = (label: string) => run.milestones.find((m) => m.label === label)?.at ?? Infinity;

    it('prints the milestone table', () => {
        // eslint-disable-next-line no-console
        console.log(
            run.milestones.map((m) => `${m.label.padEnd(18)} ${minutes(m.at).padStart(7)} min`).join('\n') +
                `\navg harmony ${run.avgHarmony.toFixed(2)}, achievements ${run.state.achievements.length}`,
        );
        expect(run.milestones.length).toBeGreaterThan(5);
    });

    it('reaches the second plant within the first two minutes', () => {
        expect(at('plant:fern')).toBeLessThan(120);
    });

    it('opens the first new zone in under 45 minutes', () => {
        expect(at('zone:meadow')).toBeLessThan(45 * 60);
    });

    it('makes the first cycle (prestige) available within 1–3 hours', () => {
        expect(at('wisdom:1')).toBeGreaterThan(45 * 60);
        expect(at('wisdom:1')).toBeLessThan(3 * 3600);
    });

    it('a mindful garden stays in harmony most of the time', () => {
        expect(run.avgHarmony).toBeGreaterThan(0.7);
    });

    it('balance is rewarded: a careless garden earns clearly less', () => {
        const careless = runBot({ seconds: 3600, clicksPerSecond: active, mindful: false });
        const mindful = runBot({ seconds: 3600, clicksPerSecond: active, mindful: true });
        expect(mindful.state.stats.runChi).toBeGreaterThan(careless.state.stats.runChi);
    });
});
