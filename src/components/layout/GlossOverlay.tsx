import React from 'react';
import { cn } from '@/lib/utils';

interface GlossOverlayProps {
    className?: string;
    style?: React.CSSProperties;
}

export const GlossOverlay = ({ className }: GlossOverlayProps) => {
    return (
        <div
            className={cn("fixed inset-0 z-[-2] pointer-events-none gloss-overlay", className)}
        />
    );
};
