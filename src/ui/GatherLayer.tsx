import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Floater {
    id: number;
    x: number;
    y: number;
    text: string;
}

let floaterId = 0;

/** Invisible hit area over the landscape: tap anywhere to gather chi. */
export const GatherLayer = ({ rect, showHint }: { rect: Rect; showHint: boolean }) => {
    const { t } = useTranslation();
    const gather = useGameStore((s) => s.actions.gather);
    const [floaters, setFloaters] = useState<Floater[]>([]);

    const trigger = useCallback(
        (x: number, y: number) => {
            const value = useGameStore.getState().rates.clickValue;
            gather(x, y);
            const id = ++floaterId;
            setFloaters((list) => [...list.slice(-12), { id, x, y, text: `+${formatNumber(value)}` }]);
            window.setTimeout(() => setFloaters((list) => list.filter((f) => f.id !== id)), 1150);
        },
        [gather],
    );

    return (
        <>
            <button
                className="gather-layer"
                style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                aria-label={t('tutorial.step0.title')}
                onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    trigger(e.clientX, e.clientY);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        trigger(rect.x + rect.w / 2, rect.y + rect.h * 0.6);
                    }
                }}
            />
            {showHint && <div className="touch-hint" style={{ left: rect.x + rect.w / 2, top: rect.y + rect.h * 0.62 }} />}
            {floaters.map((f) => (
                <div key={f.id} className="float-number num" style={{ left: f.x, top: f.y }} aria-hidden="true">
                    {f.text}
                </div>
            ))}
        </>
    );
};
