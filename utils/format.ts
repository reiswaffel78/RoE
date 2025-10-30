// utils/format.ts

const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

/**
 * Formats a number into a compact, readable string with suffixes for large numbers.
 * @param num The number to format.
 * @returns A formatted string.
 */
export const formatNumber = (num: number): string => {
    if (num < 1000) {
        if (Number.isInteger(num)) {
            return num.toString();
        }
        return num.toFixed(1).replace(/\.0$/, '');
    }

    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);

    if (tier >= suffixes.length) {
        return num.toExponential(2);
    }

    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;

    return scaled.toFixed(2) + suffix;
};

/**
 * Formats time in seconds to a HH:MM:SS string.
 * @param seconds The total seconds.
 * @returns A formatted time string.
 */
export const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};
