"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Player from "video.js/dist/types/player";

interface LivePlayerProps {
    streamUrl: string;
    posterUrl?: string;
    playlist?: string[]; // Array of VOD URLs for J-Tube Originals continuity
}

export function LivePlayer({ streamUrl, posterUrl, playlist }: LivePlayerProps) {
    const videoParentRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const currentPlaylistIndex = useRef(0);

    useEffect(() => {
        if (!videoParentRef.current) return;

        // Prevent double initialization in React Strict Mode
        if (playerRef.current) return;

        // Create the video element dynamically to avoid DOM mismatch issues after `dispose()`
        const videoElement = document.createElement("video");
        videoElement.classList.add('video-js');
        videoElement.classList.add('vjs-big-play-centered');
        videoParentRef.current.appendChild(videoElement);

        // Initialize Video.js player
        const player = playerRef.current = videojs(videoElement, {
            controls: true,
            autoplay: true,
            muted: false,
            fill: true,
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
        }, () => {
            player.log('player is ready');
        });

        // Listen for VOD end to simulate continuous broadcasting
        player.on('ended', () => {
            if (playlist && playlist.length > 0 && playerRef.current) {
                // Move to next video in the playlist
                currentPlaylistIndex.current = (currentPlaylistIndex.current + 1) % playlist.length;
                const nextUrl = playlist[currentPlaylistIndex.current];

                playerRef.current.src({
                    src: nextUrl,
                    type: nextUrl?.endsWith(".m3u8") ? "application/x-mpegURL" : "video/mp4"
                });
                playerRef.current?.play()?.catch(e => console.error("Autoplay prevented on continuity switch:", e));
            }
        });

        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [streamUrl, posterUrl, playlist]);

    // Handle prop URL changes without recreating entire player
    useEffect(() => {
        if (playerRef.current && streamUrl) {
            currentPlaylistIndex.current = 0; // Reset continuity index on new channel
            playerRef.current.src({
                src: streamUrl,
                type: streamUrl.endsWith(".m3u8") ? "application/x-mpegURL" : "video/mp4",
            });
            playerRef.current?.play()?.catch(e => console.error("Autoplay prevented on channel switch:", e));
        }
    }, [streamUrl]);

    return (
        <div data-vjs-player className="w-full h-full bg-black flex items-center justify-center rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div ref={videoParentRef} className="w-full h-full" />
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
