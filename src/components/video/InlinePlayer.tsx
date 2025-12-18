"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface InlinePlayerProps {
    src: string;
    poster?: string;
}

export function InlinePlayer({ src, poster }: InlinePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasStarted, setHasStarted] = useState(false);

    const startVideo = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setHasStarted(true);
        }
    };

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
                className="w-full h-full object-contain"
            >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Initial Play Overlay with thumbnail - HIDDEN ON MOBILE */}
            {!hasStarted && (
                <div
                    className="absolute inset-0 hidden sm:flex items-center justify-center cursor-pointer"
                    onClick={startVideo}
                >
                    {/* Show poster/thumbnail as background */}
                    {poster && (
                        <img
                            src={poster}
                            alt="Video thumbnail"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    {/* Play button on top */}
                    <div className="relative z-10 p-5 bg-j-red/90 rounded-full shadow-2xl hover:scale-110 transition-transform">
                        <Play className="w-14 h-14 text-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}
