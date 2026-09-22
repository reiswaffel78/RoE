// Deterministic, serialisable RNG (mulberry32). The state is a single uint32
// that lives inside GameState, so offline simulation is reproducible.

export const nextRandom = (state: number): [value: number, next: number] => {
    const next = (state + 0x6d2b79f5) >>> 0;
    let t = next;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return [value, next];
};

/** Mutable helper for code paths that draw several numbers in a row. */
export class Rng {
    constructor(public state: number) {}

    next(): number {
        const [value, next] = nextRandom(this.state);
        this.state = next;
        return value;
    }

    range(min: number, max: number): number {
        return min + (max - min) * this.next();
    }

    pickWeighted<T extends string>(weights: Partial<Record<T, number>>): T {
        const entries = Object.entries(weights) as [T, number][];
        const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
        let roll = this.next() * total;
        for (const [key, weight] of entries) {
            roll -= Math.max(0, weight);
            if (roll <= 0) return key;
        }
        return entries[entries.length - 1][0];
    }
}

export const seedFromTime = (): number => (Date.now() ^ 0x9e3779b9) >>> 0;
