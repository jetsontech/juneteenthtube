"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { Play, Pause, Volume2, VolumeX, Maximize, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LivePlayer({ streamUrl, onToggleChat }: { streamUrl: string; onToggleChat?: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!videoRef.current) return;

        // Initialize with advanced HLS settings
        const player = videojs(videoRef.current, {
            autoplay: true,
            muted: true,
            controls: false,
            responsive: true,
            fluid: true,
            html5: {
                vhs: {
                    overrideNative: true,
                    handleManifestRedirects: true,
                    enableLowInitialConfig: true
                }
            }
        });

        playerRef.current = player;

        player.on('play', () => { setIsPlaying(true); setHasError(false); });
        player.on('pause', () => setIsPlaying(false));
        player.on('error', (e) => {
            console.error("VideoJS Error:", player.error());
            setHasError(true);
        });

        return () => { player.dispose(); };
    }, []);

    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false);
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            
            player.src({
                src: proxiedUrl,
                type: 'application/x-mpegURL'
            });

            // Force a reload of the source tech
            player.load();
            player.play().catch(() => console.log("Autoplay waiting..."));
        }
    }, [streamUrl]);

    if (hasError) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-widest text-lg">Signal Interrupted</h3>
                <p className="text-white/40 text-[10px] uppercase mt-2">Attempting to re-acquire broadcast link...</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                    Hard Reset
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group">
            <video ref={videoRef} className={cn("video-js vjs-big-play-centered w-full h-full transition-transform duration-700", isZoomed ? "scale-150" : "scale-100")} playsInline />
            
            {/* Minimal Overlay for Control */}
            <div className="absolute inset-0 z-40 p-8 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Live • {streamUrl.split('/')[2]}</span>
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
