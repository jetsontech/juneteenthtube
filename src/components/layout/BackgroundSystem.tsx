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
            {/* 
                Advanced Static Gradient Compositing 
                replaces heavy CSS blurs/animations for maximum mobile stability 
                while maintaining premium aesthetic. 
            */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#050505_100%)] opacity-80" />

            {/* Subtle Gold/Green accents via slight gradients instead of blurs */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_100%_0%,_#3f2e05_0%,_transparent_70%)] opacity-20" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_0%_100%,_#0a2f0a_0%,_transparent_70%)] opacity-20" />

            {/* Micro-noise texture for film grain feel (static image, high perf) */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none noise-texture"
                style={{ backgroundImage: 'url("/noise.png")' }}
            />

            {/* Gloss Overlay - Topmost background layer */}
            <GlossOverlay className="absolute inset-0 z-[0]" />
        </div>
    );
};
