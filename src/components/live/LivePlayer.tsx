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
    // We use a placeholder div instead of a video tag to prevent React crashes
    const placeholderRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Initialize Video.js manually inside the placeholder
    useEffect(() => {
        // Prevent double initialization in Next.js Strict Mode
        if (!playerRef.current && placeholderRef.current) {
            
            // 1. Create the video element manually
            const videoElement = document.createElement("video-js");
            videoElement.classList.add('vjs-fill'); // Makes it fill the container
            
            // 2. Append it to our React-managed placeholder
            placeholderRef.current.appendChild(videoElement);

            // 3. Initialize Video.js
            const player = videojs(videoElement, {
                autoplay: true,
                muted: true,
                controls: false,
                responsive: true,
                fluid: false, // Set to false when using vjs-fill
                html5: { 
                    vhs: { 
                        overrideNative: true,
                        handleManifestRedirects: true 
                    } 
                }
            });

            playerRef.current = player;

            player.on('play', () => { setIsPlaying(true); setHasError(false); });
            player.on('pause', () => setIsPlaying(false));
            player.on('error', () => setHasError(true));
        }

        // Cleanup function
        return () => {
            if (playerRef.current && !playerRef.current.isDisposed()) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []); // Only run once on mount

    // Load Source via Proxy when streamUrl changes
    useEffect(() => {
        const player = playerRef.current;
        if (player && streamUrl) {
            setHasError(false);
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            
            player.src({ 
                src: proxiedUrl, 
                type: 'application/x-mpegURL' 
            });
            
            player.play().catch(() => console.log("Waiting for user interaction"));
        }
    }, [streamUrl]);

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6">
                <Zap className="w-12 h-12 text-red-600 mb-4 animate-pulse" />
                <h3 className="text-white font-bold uppercase tracking-widest text-lg">Signal Lost</h3>
                <p className="text-white/50 text-xs uppercase mt-2 mb-6">Connection to provider failed</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 border border-white/20 text-white hover:bg-white/10 uppercase text-xs font-bold tracking-widest transition-colors">
                    Reboot Player
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden group select-none">
            
            {/* The React-Safe Placeholder. React manages this DIV, Video.js manages what's inside it. */}
            <div 
                ref={placeholderRef} 
                className={cn(
                    "w-full h-full absolute inset-0 transition-transform duration-700",
                    isZoomed ? "scale-125" : "scale-100"
                )} 
            />
            
            {/* Custom UI Overlay */}
            <div className="absolute inset-0 z-40 p-8 flex flex-col justify-between bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-white/80 text-xs font-black uppercase tracking-[0.2em]">Live Signal</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => isPlaying ? playerRef.current?.pause() : playerRef.current?.play()} className="hover:scale-110 transition-transform">
                            {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white" />}
                        </button>
                        <button onClick={() => { const m = !playerRef.current?.muted(); playerRef.current?.muted(m); setIsMuted(!!m); }} className="hover:text-white text-white/70 transition-colors">
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                    </div>
                    <div className="flex items-center gap-5">
                        <button onClick={() => setIsZoomed(!isZoomed)} className="text-white/50 hover:text-white transition-colors">
                            <ZoomIn className="w-6 h-6" />
                        </button>
                        <button onClick={() => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                containerRef.current?.requestFullscreen();
                            }
                        }} className="text-white/50 hover:text-white transition-colors">
                            <Maximize className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
