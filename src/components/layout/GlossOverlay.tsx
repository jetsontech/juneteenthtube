import React from 'react';
import { cn } from '@/lib/utils';

interface GlossOverlayProps {
    className?: string;
    style?: React.CSSProperties;
}

export const GlossOverlay = ({ className, style }: GlossOverlayProps) => {
    return (
        <div
            className={cn("fixed inset-0 z-[-2] pointer-events-none", className)}
            style={{
                // Glossy gradient: Subtle white shine from top-left
                background: 'linear-gradient(125deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.0) 40%, rgba(0,0,0,0) 100%)',
                // Glass effect to blur the underlying colored blobs
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                ...style
            }}
        />
    );
};
