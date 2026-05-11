"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Tv,
    MessageCircle,
    Zap,
    SkipForward,
    PictureInPicture,
    Cast,
    Subtitles,
    ZoomIn,
    ZoomOut,
    ChevronUp,
    ChevronDown,
    Radio,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgramMetadata {
    title: string;
    description?: string;
    year?: string;
    duration?: string;
    director?: string;
    startTime?: string;
    endTime?: string;
}

interface LivePlayerProps {
    streamUrl: string;
    posterUrl?: string;
    playlist?: string[];
    channelName?: string;
    channelLogo?: string;
    channelNumber?: number;
    accentColor?: string;
    currentProgram?: ProgramMetadata;
    nextProgram?: ProgramMetadata;
    onNext?: () => void;
    onPrev?: () => void;
    onToggleChat?: () => void;
}

function UpNextToast({ nextFilm, visible, accent }: { nextFilm?: ProgramMetadata; visible: boolean; accent: string }) {
    if (!nextFilm) return null;
    const accentText = accent === "yellow" ? "text-yellow-500" : accent === "amber" ? "text-amber-500" : accent === "purple" ? "text-purple-400" : "text-red-400";

    return (
        <div className={cn(
            "absolute bottom-24 right-8 z-40 max-w-sm bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-2xl transition-all duration-500",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
            <div className="flex items-center gap-1.5 mb-2">
                <SkipForward className={cn("w-3 h-3", accentText)} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", accentText)}>Up Next</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{nextFilm.title}</h4>
        </div>
    );
}

export function LivePlayer({
    streamUrl,
    playlist,
    accentColor = "red",
    nextProgram,
    onToggleChat,
    // Rest are included to prevent "Property does not exist" hydration errors
    posterUrl,
    channelName,
    channelLogo,
    channelNumber,
    currentProgram,
    onNext,
    onPrev
}: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentPlaylistIndex = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [showUpNext, setShowUpNext] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            controls: false,
            autoplay: true,
            muted: true,
            preload: "auto",
            fluid: false,
            playsinline: true,
            html5: { vhs: { overrideNative: true } }
        }, () => {
            playerRef.current = player;
        });

        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => setIsPlaying(false));
        player.on('error', () => setHasError(true));
        
        player.on('timeupdate', () => {
            const dur = player.duration();
            const cur = player.currentTime();
            if (dur && cur) {
                const pct = (cur / dur) * 100;
                if (progressBarRef.current) progressBarRef.current.style.width = `${pct}%`;
                setShowUpNext(nextProgram && (pct > 95 || (dur - cur < 30)));
            }
        });

        player.on('ended', () => {
            if (playlist?.length) {
                currentPlaylistIndex.current = (currentPlaylistIndex.current + 1) % playlist.length;
                const nextUrl = playlist[currentPlaylistIndex.current];
                const proxied = `/api/cors-proxy?url=${encodeURIComponent(nextUrl)}`;
                player.src({ src: proxied, type: 'application/x-mpegURL' });
            }
        });

        return () => { 
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [playlist, nextProgram]);

    useEffect(() => {
        if (playerRef.current && streamUrl) {
            setHasError(false);
            const proxiedUrl = `/api/cors-proxy?url=${encodeURIComponent(streamUrl)}`;
            playerRef.current.src({
                src: proxiedUrl,
                type: streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
            });
        }
    }, [streamUrl]);

    const togglePlay = () => isPlaying ? playerRef.current?.pause() : playerRef.current?.play();
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const muted = !playerRef.current?.muted();
        playerRef.current?.muted(muted);
        setIsMuted(!!muted);
    };

    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center">
                <Zap className="w-8 h-8 text-red-500 mb-4" />
                <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Stream Unavailable</p>
            </div>
        );
    }

    const accentBg = accentColor === "yellow" ? "bg-yellow-500" : "bg-red-600";

    return (
        <div
            ref={containerRef}
            onClick={togglePlay}
            onMouseMove={() => { 
                setShowControls(true); 
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current); 
                hideTimerRef.current = setTimeout(() => setShowControls(false), 3000); 
            }}
            className="relative w-full h-full bg-black overflow-hidden group cursor-pointer"
        >
            <div data-vjs-player className="w-full h-full">
                <video ref={videoRef} className={cn("video-js vjs-default-skin w-full h-full transition-transform duration-500", isZoomed ? "scale-110" : "scale-100")} crossOrigin="anonymous" />
            </div>
            
            <UpNextToast nextFilm={nextProgram} visible={showUpNext} accent={accentColor} />

            <div className={cn("absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-50 transition-all", showControls ? "opacity-100" : "opacity-0")}>
                <div ref={progressBarRef} className={cn("h-full transition-all", accentBg)} />
            </div>

            <div className={cn("absolute bottom-0 left-0 right-0 z-40 p-6 md:p-10 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0")}>
                <div className="flex items-center justify-between pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay}>{isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}</button>
                        <button onClick={toggleMute}>{isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}</button>
                        <button onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }}><MessageCircle className="w-6 h-6 text-white/60 hover:text-white" /></button>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsZoomed(!isZoomed)}><ZoomIn className="w-6 h-6 text-white/60" /></button>
                        <button onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="w-6 h-6 text-white/60" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
