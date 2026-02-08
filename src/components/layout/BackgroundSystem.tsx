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
            {/* 2. Animated Colored Blobs - PERFORMANCE OPTIMIZED */}
            {/* Reduced blur radius and simplified opacity for better mobile/laptop performance */}
            <div className="absolute inset-0 overflow-hidden opacity-60">
                <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[60%] bg-red-900/20 rounded-full blur-[60px]" />
                <div className="absolute top-[40%] -right-[10%] w-[80%] h-[60%] bg-yellow-900/10 rounded-full blur-[60px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-green-900/15 rounded-full blur-[50px]" />
            </div>

            <div
                className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none noise-texture"
            />

            {/* 4. Gloss Overlay - Topmost background layer */}
            <GlossOverlay className="absolute inset-0 z-[0]" />
        </div>
    );
};
