// components/PixiBackground.tsx
import React, { useRef, useEffect } from 'react';
import { initPixi, cleanupPixi } from '../render/pixi/stage';

const PixiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const app = initPixi(canvasRef.current);

            return () => {
                cleanupPixi(app);
            };
        }
    }, []);

    return (
        <div 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full z-0"
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default PixiBackground;
