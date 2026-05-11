"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { Play, Pause, Volume2, VolumeX, Maximize, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePlayerProps {
    streamUrl: string;
    accentColor?: string;
    onToggleChat?: () => void;
}

export function LivePlayer({ streamUrl }: LivePlayerProps) {
    const placeholderRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
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
                responsive: true,
                html5: { vhs: { overrideNative: true } }
            });

            playerRef.current = player;
            player.on('play', () => { setIsPlaying(true); setHasError(false); });
            player.on('pause', () => setIsPlaying(false));
            player.on('error', () => setHasError(true));
        }

        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false);
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            player.src({ src: proxiedUrl, type: 'application/x-mpegURL' });
            player.load();
            player.play().catch(() => {});
        }
    }, [streamUrl]);

    const handleReboot = () => {
        setHasError(false);
        window.location.reload();
    };

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-tighter text-lg">Signal Lost</h3>
                <p className="text-white/40 text-[10px] mt-2 mb-8 uppercase tracking-widest">Connection to provider timed out</p>
                <button onClick={handleReboot} className="px-8 py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all rounded-full shadow-2xl">
                    Reboot Signal
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group select-none">
            <div ref={placeholderRef} className={cn("w-full h-full absolute inset-0 transition-transform duration-700", isZoomed ? "scale-150" : "scale-100")} />
            
            <div className="absolute inset-0 z-40 p-10 flex flex-col justify-between bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em]">Live Feed</span>
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
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsZoomed(!isZoomed)}><ZoomIn className="w-6 h-6 text-white/50 hover:text-white" /></button>
                        <button onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="w-6 h-6 text-white/50 hover:text-white" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
