"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface InlinePlayerProps {
    src: string;
    poster?: string;
}

export function InlinePlayer({ src, poster }: InlinePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    return (
        <div className="relative w-full h-full bg-black">
            {/* Native HTML5 Video with full controls */}
            <video
                ref={videoRef}
                controls
                playsInline
                // @ts-ignore
                webkit-playsinline=""
                poster={poster}
                className="w-full h-full object-cover"
            >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div >
    );
}
