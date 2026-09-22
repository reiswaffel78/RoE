// Pure maths helpers used by the economy.

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

export const finiteOr = (value: number, fallback: number): number =>
    Number.isFinite(value) ? value : fallback;

/**
 * Harmony of the garden as a Gaussian bell around perfect equilibrium (50).
 * h(50) = 1, h(50 ± width) = 1/e.
 */
export const harmonyFactor = (balance: number, width: number): number => {
    const d = (balance - 50) / width;
    return Math.exp(-d * d);
};

/** Cost of the next single level for an exponential cost curve. */
export const levelCost = (base: number, growth: number, level: number): number =>
    base * Math.pow(growth, level);

/**
 * Cost of buying `count` levels starting at `level`, closed-form geometric series:
 *   sum_{i=0}^{n-1} base * r^(L+i) = base * r^L * (r^n - 1) / (r - 1)
 */
export const bulkCost = (base: number, growth: number, level: number, count: number): number => {
    if (count <= 0) return 0;
    return (base * Math.pow(growth, level) * (Math.pow(growth, count) - 1)) / (growth - 1);
};

/**
 * Maximum number of levels affordable with `budget`, inverse of bulkCost:
 *   n = floor( log_r( budget * (r - 1) / (base * r^L) + 1 ) )
 */
export const maxAffordable = (base: number, growth: number, level: number, budget: number): number => {
    if (budget <= 0) return 0;
    const first = base * Math.pow(growth, level);
    if (budget < first) return 0;
    const n = Math.floor(Math.log((budget * (growth - 1)) / first + 1) / Math.log(growth));
    // Guard against floating point overshoot.
    let count = Math.max(0, n);
    while (count > 0 && bulkCost(base, growth, level, count) > budget * (1 + 1e-12)) count -= 1;
    return count;
};

/** Asymptotic soft cap: approaches `cap` but never reaches it. */
export const softCap = (value: number, cap: number): number => (cap * value) / (cap + value);

/** Smoothstep for gentle transitions (0..1). */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
};

/**
 * Exact solution of exponential approach dx/dt = (target - x) * k over dt.
 * Used for balance drift so large steps stay stable.
 */
export const approach = (current: number, target: number, rate: number, dt: number): number =>
    target + (current - target) * Math.exp(-rate * dt);
