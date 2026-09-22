import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlantPick } from '../render/scene/GardenScene';
import { useGameStore } from '../store/gameStore';
import { formatNumber } from '../utils/format';
import { pickScenePlant } from './SceneHost';

/** Small sign pinned above a plant, like a botanist's label. */
const PlantLabel = ({ pick }: { pick: PlantPick }) => {
    const { t } = useTranslation();
    const level = useGameStore((s) => s.game.plants[pick.id]);
    const output = useGameStore((s) => s.rates.perPlant[pick.id]);
    return (
        <div className="plant-label glass" style={{ left: pick.x, top: pick.y }} aria-hidden="true">
            <div className="plant-label__name">{t(`plants.${pick.id}.name`)}</div>
            <div className="plant-label__meta">
                {t('buy.level', { level })} · <span className="num">+{formatNumber(output)}</span> Chi/s
            </div>
        </div>
    );
};

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
    const [hover, setHover] = useState<PlantPick | null>(null);
    const frame = useRef(0);

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
                onPointerMove={(e) => {
                    if (e.pointerType !== 'mouse') return;
                    const { clientX, clientY } = e;
                    cancelAnimationFrame(frame.current);
                    frame.current = requestAnimationFrame(() => {
                        const pick = pickScenePlant(clientX, clientY);
                        setHover((prev) => (prev?.id === pick?.id && prev?.x === pick?.x ? prev : pick));
                    });
                }}
                onPointerLeave={() => setHover(null)}
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
            {hover && <PlantLabel pick={hover} />}
            {floaters.map((f) => (
                <div key={f.id} className="float-number num" style={{ left: f.x, top: f.y }} aria-hidden="true">
                    {f.text}
                </div>
            ))}
        </>
    );
};
