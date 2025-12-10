"use client";

import { useMemo } from "react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

interface PlyrPlayerProps {
    src: string;
    poster?: string;
}

export function PlyrPlayer({ src, poster }: PlyrPlayerProps) {
    const plyrProps = useMemo(() => ({
        source: {
            type: "video" as const,
            sources: [{ src, type: "video/mp4" }],
            poster,
        },
        options: {
            controls: [
                "play-large",
                "play",
                "progress",
                "current-time",
                "mute",
                "volume",
                "captions",
                "settings",
                "pip",
                "airplay",
                "fullscreen",
            ],
            fullscreen: {
                enabled: true,
                fallback: true,
                iosNative: false, // CRITICAL: Prevents iOS fullscreen popup
            },
            autopause: true,
            keyboard: { focused: true, global: false },
            tooltips: { controls: true, seek: true },
            hideControls: true,
            resetOnEnd: false,
        },
    }), [src, poster]);

    return (
        <div className="plyr-wrapper w-full h-full [&_.plyr]:w-full [&_.plyr]:h-full [&_video]:object-contain">
            <Plyr {...plyrProps} />
        </div>
    );
}
