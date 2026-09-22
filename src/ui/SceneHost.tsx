import { useEffect, useRef, useState } from 'react';
import { GardenScene, type PlantPick, type Viewport } from '../render/scene/GardenScene';

let activeScene: GardenScene | null = null;

/** Plant under a screen point, for hover labels outside the canvas. */
export const pickScenePlant = (x: number, y: number): PlantPick | null => activeScene?.pickPlant(x, y) ?? null;
import { useSettings } from '../store/settingsStore';

interface SceneHostProps {
    viewport: Viewport;
    chiTarget: { x: number; y: number } | null;
    onReady: () => void;
}

/** Mounts the Pixi garden; falls back to a painted gradient without WebGL. */
export const SceneHost = ({ viewport, chiTarget, onReady }: SceneHostProps) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<GardenScene | null>(null);
    const [failed, setFailed] = useState(false);
    const quality = useSettings((s) => s.quality);
    const reducedMotion = useSettings((s) => s.reducedMotion);
    const readyRef = useRef(onReady);
    readyRef.current = onReady;
    const viewportRef = useRef(viewport);
    viewportRef.current = viewport;

    useEffect(() => {
        let cancelled = false;
        const host = hostRef.current;
        if (!host) return;
        const settings = useSettings.getState();
        GardenScene.create(host, settings.quality, settings.reducedMotion)
            .then((scene) => {
                if (cancelled) {
                    scene.destroy();
                    return;
                }
                sceneRef.current = scene;
                activeScene = scene;
                scene.setViewport(viewportRef.current);
                readyRef.current();
            })
            .catch((error) => {
                console.error('Garden scene failed to start', error);
                setFailed(true);
                readyRef.current();
            });
        return () => {
            cancelled = true;
            if (activeScene === sceneRef.current) activeScene = null;
            sceneRef.current?.destroy();
            sceneRef.current = null;
        };
    }, []);

    useEffect(() => sceneRef.current?.setViewport(viewport), [viewport]);
    useEffect(() => {
        if (chiTarget) sceneRef.current?.setChiTarget(chiTarget.x, chiTarget.y);
    }, [chiTarget]);
    useEffect(() => sceneRef.current?.setQuality(quality), [quality]);
    useEffect(() => sceneRef.current?.setReducedMotion(reducedMotion), [reducedMotion]);

    return (
        <>
            {failed && <div className="scene-fallback" aria-hidden="true" />}
            <div ref={hostRef} className="scene-host" aria-hidden="true" />
        </>
    );
};
