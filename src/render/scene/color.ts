// Colour helpers working on 0xRRGGBB integers.

export type RGB = [number, number, number];

export const hex = (value: string): number => parseInt(value.replace('#', ''), 16);

export const toRgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

export const fromRgb = ([r, g, b]: RGB): number =>
    (Math.round(Math.max(0, Math.min(255, r))) << 16) |
    (Math.round(Math.max(0, Math.min(255, g))) << 8) |
    Math.round(Math.max(0, Math.min(255, b)));

export const mix = (a: number, b: number, t: number): number => {
    const x = toRgb(a);
    const y = toRgb(b);
    return fromRgb([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

export const scale = (c: number, f: number): number => {
    const [r, g, b] = toRgb(c);
    return fromRgb([r * f, g * f, b * f]);
};

/** Normalised float triple for shader uniforms. */
export const toVec3 = (c: number, out: Float32Array | number[] = new Float32Array(3)) => {
    out[0] = ((c >> 16) & 255) / 255;
    out[1] = ((c >> 8) & 255) / 255;
    out[2] = (c & 255) / 255;
    return out;
};

export const luminance = (c: number): number => {
    const [r, g, b] = toRgb(c);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};
