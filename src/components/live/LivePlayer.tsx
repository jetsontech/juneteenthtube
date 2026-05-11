"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { Play, Pause, Volume2, VolumeX, Maximize, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LivePlayer({ streamUrl }: { streamUrl: string }) {
    const placeholderRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!playerRef.current && placeholderRef.current) {
            const videoElement = document.createElement("video-js");
            videoElement.classList.add('vjs-fill');
            placeholderRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: true,
                muted: true,
                controls: false,
                html5: { vhs: { overrideNative: true, handleManifestRedirects: true } }
            });

            playerRef.current = player;
            player.on('play', () => { setIsPlaying(true); setHasError(false); });
            player.on('pause', () => setIsPlaying(false));
            player.on('error', () => {
                console.log("Stream error - retrying...");
                setHasError(true);
            });
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            const loadStream = () => {
                setHasError(false);
                const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
                player.src({ src: proxiedUrl, type: 'application/x-mpegURL' });
                player.play().catch(() => {});
            };
            loadStream();
        }
    }, [streamUrl]);

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-widest">Re-Acquiring Signal</h3>
                <button onClick={() => window.location.reload()} className="mt-4 text-[10px] text-white/40 uppercase font-black underline">Manual Refresh</button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black overflow-hidden group">
            <div ref={placeholderRef} className={cn("w-full h-full absolute inset-0 transition-transform duration-700", isZoomed ? "scale-150" : "scale-100")} />
            
            <div className="absolute inset-0 z-40 p-10 flex flex-col justify-between bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Live</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}>
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                        <button onClick={() => { const m = !playerRef.current?.muted(); playerRef.current?.muted(m); setIsMuted(!!m); }}>
                            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                        </button>
                    </div>
                    <button onClick={() => setIsZoomed(!isZoomed)} className="text-white/50 hover:text-white"><ZoomIn className="w-6 h-6" /></button>
                </div>
            </div>
        </div>
    );
}
