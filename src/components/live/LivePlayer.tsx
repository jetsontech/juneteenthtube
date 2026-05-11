"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { Play, Pause, Volume2, VolumeX, Maximize, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LivePlayer({ streamUrl }: { streamUrl: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // 1. Prevent Hydration Crash
    useEffect(() => {
        setMounted(true);
    }, []);

    // 2. Initialize Player ONLY on Client
    useEffect(() => {
        if (!mounted || !videoRef.current) return;

        const player = videojs(videoRef.current, {
            autoplay: true,
            muted: true,
            controls: false,
            responsive: true,
            fluid: true,
            html5: { vhs: { overrideNative: true } }
        });

        playerRef.current = player;
        player.on('play', () => { setIsPlaying(true); setHasError(false); });
        player.on('pause', () => setIsPlaying(false));
        player.on('error', () => setHasError(true));

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [mounted]);

    // 3. Load Source via Proxy
    useEffect(() => {
        if (playerRef.current && streamUrl && mounted) {
            setHasError(false);
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            playerRef.current.src({ src: proxiedUrl, type: 'application/x-mpegURL' });
            playerRef.current.play().catch(() => {});
        }
    }, [streamUrl, mounted]);

    if (!mounted) return <div className="w-full h-full bg-black animate-pulse" />;

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-widest">Signal Lost</h3>
                <button onClick={() => window.location.reload()} className="mt-4 text-[10px] text-white/40 hover:text-white uppercase font-black underline">Retry Connection</button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group">
            <video ref={videoRef} className={cn("video-js w-full h-full transition-transform duration-700", isZoomed ? "scale-150" : "scale-100")} playsInline />
            
            <div className="absolute inset-0 z-40 p-8 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Live Signal</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}>
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                        <button onClick={() => { const m = !playerRef.current?.muted(); playerRef.current?.muted(m); setIsMuted(!!m); }}>
                            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsZoomed(!isZoomed)} className="text-white/50 hover:text-white"><ZoomIn className="w-6 h-6" /></button>
                        <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/50 hover:text-white"><Maximize className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
