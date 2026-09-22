// Deterministic procedural helpers for the renderer (not tied to game RNG).

export const mulberry = (seed: number) => {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** 1D value noise with smooth interpolation, period-free. */
export const makeNoise1D = (seed: number) => {
    const rand = mulberry(seed);
    const table = Array.from({ length: 512 }, () => rand());
    const at = (i: number) => table[((i % 512) + 512) % 512];
    return (x: number) => {
        const i = Math.floor(x);
        const f = x - i;
        const t = f * f * (3 - 2 * f);
        return at(i) + (at(i + 1) - at(i)) * t;
    };
};

export const fbm1D = (noise: (x: number) => number, x: number, octaves = 5, lacunarity = 2, gain = 0.5) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
        sum += amp * noise(x * freq + o * 13.7);
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
    }
    return sum / norm;
};

/** Ridged variant for sharp mountain crests. */
export const ridged1D = (noise: (x: number) => number, x: number, octaves = 5) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
        const n = 1 - Math.abs(noise(x * freq + o * 31.1) * 2 - 1);
        sum += amp * n * n;
        norm += amp;
        amp *= 0.5;
        freq *= 2.1;
    }
    return sum / norm;
};
