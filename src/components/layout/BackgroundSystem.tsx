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

            {/* 3. Subtle Noise Overlay - CSS Generative (No External Request) */}
            {/* Simulates noise using a high-frequency repeating gradient - lightweight */}
            <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* 4. Gloss Overlay - Topmost background layer */}
            <GlossOverlay className="absolute inset-0 z-[0]" />
        </div>
    );
};
