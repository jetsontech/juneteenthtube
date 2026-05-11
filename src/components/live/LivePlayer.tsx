"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import {
    Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Zap, ZoomIn, ZoomOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LivePlayerProps {
    streamUrl: string;
    accentColor?: string;
    onToggleChat?: () => void;
    // Props for parent compatibility
    posterUrl?: string;
    channelName?: string;
    channelLogo?: string;
    channelNumber?: number;
    playlist?: string[];
    currentProgram?: any;
    nextProgram?: any;
    onNext?: () => void;
    onPrev?: () => void;
}

export function LivePlayer({
    streamUrl,
    accentColor = "red",
    onToggleChat
}: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Initialize Player
    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            autoplay: true,
            muted: true,
            controls: false,
            responsive: true,
            fluid: true,
            html5: {
                vhs: { 
                    overrideNative: true,
                    fastQualityChange: true
                }
            }
        });

        playerRef.current = player;

        player.on('play', () => { setIsPlaying(true); setHasError(false); });
        player.on('pause', () => setIsPlaying(false));
        player.on('error', () => {
            console.error("Player Error:", player.error());
            setHasError(true);
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    // Load Stream via Proxy
    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false);
            
            // Critical: Double-check that the URL is actually proxied
            const proxiedUrl = streamUrl.startsWith('http') 
                ? `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`
                : streamUrl;
            
            player.src({
                src: proxiedUrl,
                type: 'application/x-mpegURL'
            });

            player.play().catch(() => {
                console.log("Autoplay blocked - waiting for user.");
            });
        }
    }, [streamUrl]);

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase text-lg">Stream Unavailable</h3>
                <p className="text-white/40 text-xs mt-2 text-center max-w-xs">
                    Broadcast signal interrupted. Attempting to re-establish connection...
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                >
                    Refresh Signal
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black overflow-hidden group select-none"
        >
            <div data-vjs-player className="w-full h-full">
                <video 
                    ref={videoRef} 
                    className={cn(
                        "video-js vjs-big-play-centered w-full h-full transition-transform duration-700",
                        isZoomed ? "scale-125" : "scale-100"
                    )} 
                    playsInline 
                />
            </div>

            <div className={cn(
                "absolute inset-0 z-40 flex flex-col justify-between transition-opacity duration-500",
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}>
                <div className="p-6 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Live</span>
                    </div>
                </div>

                <div className="p-6 md:p-10 bg-gradient-to-t from-black/90 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()}>
                                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
                            </button>
                            <button onClick={() => {
                                const m = !playerRef.current?.muted();
                                playerRef.current?.muted(m);
                                setIsMuted(!!m);
                            }}>
                                {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsZoomed(!isZoomed)} className="text-white/50 hover:text-white">
                                {isZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
                            </button>
                            <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white/50 hover:text-white">
                                <Maximize className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
