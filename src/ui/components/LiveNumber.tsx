import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/format';

/**
 * Smoothly interpolated counter: value + rate * time since the last tick,
 * written straight to the DOM each frame (no React re-render at 60 fps).
 */
export const LiveNumber = ({ pick, rate, className }: {
    pick: (s: ReturnType<typeof useGameStore.getState>) => number;
    rate: (s: ReturnType<typeof useGameStore.getState>) => number;
    className?: string;
}) => {
    const ref = useRef<HTMLSpanElement>(null);
    const pickRef = useRef(pick);
    const rateRef = useRef(rate);
    pickRef.current = pick;
    rateRef.current = rate;

    useEffect(() => {
        let frame = 0;
        let shown = '';
        const loop = () => {
            const s = useGameStore.getState();
            const elapsed = Math.min(1, (performance.now() - s.tickedAt) / 1000);
            const value = pickRef.current(s) + rateRef.current(s) * elapsed;
            const text = formatNumber(value);
            if (text !== shown && ref.current) {
                ref.current.textContent = text;
                shown = text;
            }
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, []);

    return <span ref={ref} className={className} />;
};
