export const formatNumber = (num: number): string => {
    if (num < 1000) return num.toFixed(1);
    if (num < 1_000_000) return `${(num / 1000).toFixed(2)}k`;
    if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    return `${(num / 1_000_000_000).toFixed(2)}B`;
};
