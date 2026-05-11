"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import {
    Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Zap, SkipForward, ZoomIn, ZoomOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramMetadata {
    title: string;
}

interface LivePlayerProps {
    streamUrl: string;
    playlist?: string[];
    accentColor?: string;
    nextProgram?: ProgramMetadata;
    onToggleChat?: () => void;
    // Props maintained for parent compatibility
    posterUrl?: string;
    channelName?: string;
    channelLogo?: string;
    channelNumber?: number;
    currentProgram?: ProgramMetadata;
    onNext?: () => void;
    onPrev?: () => void;
}

export function LivePlayer({
    streamUrl,
    playlist,
    accentColor = "red",
    nextProgram,
    onToggleChat
}: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Initialize Video.js
    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            autoplay: true,
            muted: true,
            controls: false,
            responsive: true,
            fluid: true,
            preload: "auto",
            html5: {
                vhs: { 
                    overrideNative: true,
                    handleManifestRedirects: true 
                },
                nativeAudioTracks: false,
                nativeVideoTracks: false
            }
        });

        playerRef.current = player;

        player.on('play', () => { setIsPlaying(true); setHasError(false); });
        player.on('pause', () => setIsPlaying(false));
        player.on('error', () => {
            // Only set error if it's a fatal source error
            const error = player.error();
            if (error) {
                console.error("VideoJS Error:", error);
                setHasError(true);
            }
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    // Load/Update Source via Proxy
    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false); // Reset error state on new source
            
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            
            player.src({
                src: proxiedUrl,
                type: 'application/x-mpegURL' // Force HLS type for the proxy
            });

            player.play().catch(() => {
                console.log("Autoplay prevented - waiting for interaction");
            });
        }
    }, [streamUrl]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        if (playerRef.current.paused()) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playerRef.current) return;
        const newState = !playerRef.current.muted();
        playerRef.current.muted(newState);
        setIsMuted(newState);
    };

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-tighter text-lg">Stream Unavailable</h3>
                <p className="text-white/40 text-xs mt-2 max-w-xs">The broadcast signal is currently interrupted. Please try another channel.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onClick={togglePlay}
            onMouseMove={() => {
                setShowControls(true);
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
            }}
            className="relative w-full h-full bg-black overflow-hidden group select-none"
        >
            <div data-vjs-player className="w-full h-full">
                <video 
                    ref={videoRef} 
                    className={cn(
                        "video-js vjs-big-play-centered w-full h-full transition-transform duration-700 ease-in-out",
                        isZoomed ? "scale-125" : "scale-100"
                    )} 
                    playsInline 
                />
            </div>

            {/* UI Overlay */}
            <div className={cn(
                "absolute inset-0 z-40 flex flex-col justify-between transition-opacity duration-500",
                showControls || !isPlaying ? "opacity-100" : "opacity-0"
            )}>
                <div className="p-6 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Live Broadcast</span>
                    </div>
                </div>

                <div className="p-6 md:p-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                    <div className="flex items-center justify-between pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-6">
                            <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
                            </button>
                            <button onClick={toggleMute} className="text-white/70 hover:text-white">
                                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
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
