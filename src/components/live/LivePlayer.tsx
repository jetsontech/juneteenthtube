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
    const containerRef = useRef<HTMLDivElement>(null);
    const watchdogRef = useRef<NodeJS.Timeout | null>(null);
    
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
            player.on('playing', () => { 
                setIsPlaying(true); 
                setHasError(false);
                if (watchdogRef.current) clearTimeout(watchdogRef.current);
            });
            player.on('pause', () => setIsPlaying(false));
            player.on('error', () => setHasError(true));
        }

        return () => {
            if (playerRef.current) playerRef.current.dispose();
            if (watchdogRef.current) clearTimeout(watchdogRef.current);
        };
    }, []);

    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false);
            if (watchdogRef.current) clearTimeout(watchdogRef.current);

            // Watchdog: If no 'playing' event within 15s, signal failure
            watchdogRef.current = setTimeout(() => {
                if (!player.paused() && !isPlaying) setHasError(true);
            }, 15000);

            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            player.src({ src: proxiedUrl, type: 'application/x-mpegURL' });
            player.load();
            player.play().catch(() => {});
        }
    }, [streamUrl]);

    if (hasError) return (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
            <h3 className="text-white font-bold uppercase tracking-widest text-lg">Signal Lost</h3>
            <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-full">
                Reboot Signal
            </button>
        </div>
    );

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group">
            <div ref={placeholderRef} className={cn("w-full h-full absolute inset-0 transition-transform duration-700", isZoomed ? "scale-125" : "scale-100")} />
            
            <div className="absolute inset-0 z-40 p-10 flex flex-col justify-between bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Live Signal</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}>
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                        <button onClick={() => {
                            const m = !playerRef.current?.muted();
                            playerRef.current?.muted(m);
                            setIsMuted(!!m);
                        }}>
                            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsZoomed(!isZoomed)} className="text-white/50 hover:text-white"><ZoomIn className="w-6 h-6" /></button>
                        <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/50 hover:text-white"><Maximize className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
