// components/PixiBackground.tsx
import React, { useRef, useEffect } from 'react';
import { initPixi, cleanupPixi } from '../render/pixi/stage';
import { getFlag } from '../utils/flags';
import { markBootStepError, markBootStepSuccess, recordLastError } from '../utils/bootDiagnostics';

const PixiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
        const allowPixi = !getFlag('noPixi');

    useEffect(() => {
        if (!allowPixi) {
            return;
        }

       if (canvasRef.current) {
            try {
                const app = initPixi(canvasRef.current);
                if (app) {
                    markBootStepSuccess('E', 'Pixi stage ready');
                    return () => {
                        cleanupPixi(app);
                    };
                }
                markBootStepSuccess('E', 'Pixi initialisation skipped');
            } catch (error) {
                markBootStepError('E', 'Pixi failed to initialise');
                recordLastError(error);
            }
        }
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
