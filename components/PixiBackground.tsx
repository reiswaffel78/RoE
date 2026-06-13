// components/PixiBackground.tsx
import React, { useRef, useEffect } from 'react';
import { initPixi, cleanupPixi } from '../render/pixi/stage';
import { getFlag } from '../utils/flags';
import { markBootStepError, markBootStepSuccess, recordLastError } from '../utils/bootDiagnostics';

const PixiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
        const allowPixi = !getFlag('noPixi');

    useEffect(() => {
        if (!allowPixi || !canvasRef.current) {
            return;
        }

        let app: Awaited<ReturnType<typeof initPixi>> = null;
        let cancelled = false;

        initPixi(canvasRef.current)
            .then((createdApp) => {
                if (cancelled) {
                    // Component unmounted before init resolved.
                    if (createdApp) cleanupPixi(createdApp);
                    return;
                }
                app = createdApp;
                markBootStepSuccess('E', app ? 'Pixi stage ready' : 'Pixi initialisation skipped');
            })
            .catch((error) => {
                markBootStepError('E', 'Pixi failed to initialise');
                recordLastError(error);
            });

        return () => {
            cancelled = true;
            if (app) {
                cleanupPixi(app);
            }
        };
    }, [allowPixi]);

    if (!allowPixi) {
        return null;
    }

    return (
       <div
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full"
            style={{ pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
        />
    );
};

export default PixiBackground;
