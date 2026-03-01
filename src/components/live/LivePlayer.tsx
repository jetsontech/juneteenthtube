"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";

interface LivePlayerProps {
    streamUrl: string;
    posterUrl?: string;
}

export function LivePlayer({ streamUrl, posterUrl }: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);

    useEffect(() => {
        if (!videoRef.current) return;

        // Initialize Video.js player
        playerRef.current = videojs(videoRef.current, {
            controls: true,
            autoplay: true,
            muted: true, // Required for most browsers to autoplay
            fluid: true,
            liveui: true, // Shows "LIVE" indicator
            poster: posterUrl,
            controlBar: {
                progressControl: false, // Hide scrubber because it's a live broadcast
                remainingTimeDisplay: false,
                pictureInPictureToggle: true,
            },
            sources: [
                {
                    src: streamUrl,
                    type: streamUrl.endsWith(".m3u8") ? "application/x-mpegURL" : "video/mp4",
                },
            ],
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [streamUrl, posterUrl]);

    // Handle prop URL changes without recreating entire player
    useEffect(() => {
        if (playerRef.current && streamUrl) {
            playerRef.current.src({
                src: streamUrl,
                type: streamUrl.endsWith(".m3u8") ? "application/x-mpegURL" : "video/mp4",
            });
            playerRef.current.play().catch(e => console.error("Autoplay prevented on channel switch:", e));
        }
    }, [streamUrl]);

    return (
        <div data-vjs-player className="w-full h-full bg-black flex items-center justify-center rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <video ref={videoRef} className="video-js vjs-big-play-centered" playsInline />
            <style jsx global>{`
                .video-js .vjs-tech {
                    object-fit: contain;
                }
                .video-js .vjs-live-display {
                    color: #ef4444; /* Red LIVE indicator */
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
}
