import React from 'react';
import { GlossOverlay } from './GlossOverlay';

/**
 * BackgroundSystem
 * 
 * Premium background stack:
 * 1. Deep Black Base
 * 2. Animated Colored Blobs (Red, Yellow, Green) — "Aurora" effect
 * 3. Noise Texture (Contrast boosted)
 * 4. Gloss Overlay (Glass effect)
 */
export const BackgroundSystem = () => {
    return (
        <div className="fixed inset-0 z-[-10] pointer-events-none bg-[#050505] overflow-hidden">
            {/* Animated Colored Blobs - Aurora Effect */}
            <div className="absolute inset-0 overflow-hidden opacity-80">
                <div className="absolute -top-[20%] -left-[10%] w-[90%] h-[70%] bg-red-900/15 rounded-full blur-[80px] animate-pulse duration-[8000ms]" />
                <div className="absolute top-[30%] -right-[20%] w-[100%] h-[80%] bg-yellow-900/10 rounded-full blur-[100px] animate-pulse duration-[12000ms]" />
                <div className="absolute bottom-[-20%] left-[10%] w-[80%] h-[60%] bg-green-900/15 rounded-full blur-[90px] animate-pulse duration-[10000ms]" />

                {/* Center "Spotlight" for depth */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[120px]" />
            </div>

            <div
                className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none noise-texture"
            />

            {/* Gloss Overlay - Topmost background layer */}
            <GlossOverlay className="absolute inset-0 z-[0]" />
        </div>
    );
};
