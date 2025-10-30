// utils/rng.ts

/**
 * A simple pseudorandom number generator using the Mulberry32 algorithm.
 * This is useful for creating predictable sequences of "random" numbers if needed.
 */
class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudorandom number between 0 (inclusive) and 1 (exclusive).
     */
    public next(): number {
        let t = (this.seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Returns a pseudorandom integer between min (inclusive) and max (inclusive).
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

// A global instance for general use, seeded with the current time.
export const rng = new SeededRNG(Date.now());

/**
 * A simpler, non-seeded random integer function for when predictability is not needed.
 * @param min The minimum value (inclusive).
 * @param max The maximum value (inclusive).
 * @returns A random integer within the specified range.
 */
export const randomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
