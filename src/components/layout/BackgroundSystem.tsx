import React from 'react';
import { GlossOverlay } from './GlossOverlay';

/**
 * BackgroundSystem
 * 
 * Replicates the exact background stack from the LoginSplash:
 * 1. Deep Black Base
 * 2. Animated Colored Blobs (Red, Yellow, Green)
 * 3. Noise Texture (Contrast boosted)
 * 4. Gloss Overlay (Glass effect)
 */
export const BackgroundSystem = () => {
    return (
        <div className="fixed inset-0 z-[-10] pointer-events-none bg-[#050505] overflow-hidden">
            {/* 2. Animated Colored Blobs - PERFORMANCE: Reduced blur for mobile if needed, matching Splash */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[90%] sm:w-[60%] h-[60%] bg-red-600/20 sm:bg-red-600/10 rounded-full blur-[80px] sm:blur-[100px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[90%] sm:w-[60%] h-[60%] bg-yellow-500/20 sm:bg-yellow-500/10 rounded-full blur-[80px] sm:blur-[100px]" />
                <div className="absolute top-[30%] left-[20%] sm:left-[40%] w-[50%] sm:w-[30%] h-[50%] sm:h-[30%] bg-green-500/15 sm:bg-green-500/5 rounded-full blur-[60px] sm:blur-[80px]" />
            </div>

            {/* 3. Subtle Grid/Noise Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />

            {/* 4. Gloss Overlay - Topmost background layer */}
            <GlossOverlay className="absolute inset-0 z-[0]" />
        </div>
    );
};
