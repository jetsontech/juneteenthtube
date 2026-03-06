"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    ChevronUp,
    ChevronDown,
    Tv,
    MessageCircle,
    Radio,
    Zap,
    Sparkles,
    SkipForward
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
    accentColor?: string; // e.g., 'red', 'blue', 'yellow'
    currentProgram?: ProgramMetadata;
    nextProgram?: ProgramMetadata;
    onNext?: () => void;
    onPrev?: () => void;
    onToggleChat?: () => void;
}

/* ════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════ */

function TuneInOverlay({ channelName, channelNumber, visible, accent }: { channelName: string; channelNumber?: number; visible: boolean; accent: string }) {
    const accentBg = accent === "yellow" ? "bg-yellow-600" : accent === "amber" ? "bg-amber-700" : accent === "purple" ? "bg-purple-600" : accent === "red" ? "bg-red-600" : "bg-zinc-800";
    const accentText = accent === "yellow" ? "text-yellow-500" : accent === "amber" ? "text-amber-500" : accent === "purple" ? "text-purple-400" : accent === "red" ? "text-red-400" : "text-white/60";

    return (
        <div className={cn(
            "absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all duration-700 pointer-events-none",
            visible ? "opacity-100 scale-100" : "opacity-0 scale-105"
        )}>
            <div className="text-center space-y-4">
                <div className={cn("w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-2xl transition-transform duration-700", visible ? "scale-100" : "scale-75", accentBg)}>
                    <Tv className="w-12 h-12 text-white" />
                </div>
                <div className={cn("transition-all duration-700 delay-100", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    {channelNumber && <div className={cn("text-sm font-mono font-bold uppercase tracking-widest", accentText)}>CH {channelNumber}</div>}
                    <h2 className="text-4xl font-black text-white mt-1 tracking-tight">{channelName}</h2>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Zap className={cn("w-4 h-4", accentText)} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">FAST Channel • Auto-Playing</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UpNextToast({ nextFilm, visible, accent }: { nextFilm?: ProgramMetadata; visible: boolean; accent: string }) {
    if (!nextFilm) return null;
    const accentBorder = accent === "yellow" ? "border-yellow-600/40" : accent === "amber" ? "border-amber-600/40" : accent === "purple" ? "border-purple-500/40" : accent === "red" ? "border-red-500/40" : "border-white/10";
    const accentText = accent === "yellow" ? "text-yellow-500" : accent === "amber" ? "text-amber-500" : accent === "purple" ? "text-purple-400" : accent === "red" ? "text-red-400" : "text-white/40";

    return (
        <div className={cn(
            "absolute bottom-24 right-8 z-40 max-w-sm bg-black/90 backdrop-blur-2xl rounded-2xl border p-4 shadow-2xl transition-all duration-500",
            accentBorder, visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
            <div className="flex items-center gap-1.5 mb-2">
                <SkipForward className={cn("w-3 h-3", accentText)} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", accentText)}>Up Next</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{nextFilm.title}</h4>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                {nextFilm.year && <span>{nextFilm.year}</span>}
                {nextFilm.duration && <><span>•</span><span>{nextFilm.duration}</span></>}
            </div>
        </div>
    );
}

export function LivePlayer({
    streamUrl,
    posterUrl,
    playlist,
    channelName = "JuneteenthTube",
    channelLogo,
    channelNumber,
    accentColor = "red",
    currentProgram,
    nextProgram,
    onNext,
    onPrev,
    onToggleChat
}: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentPlaylistIndex = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showTuneIn, setShowTuneIn] = useState(false);
    const [showUpNext, setShowUpNext] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [progress, setProgress] = useState(0);

    // ── FAST Overlay Logic ────────────────────────────
    useEffect(() => {
        if (streamUrl) {
            setShowTuneIn(true);
            const timer = setTimeout(() => setShowTuneIn(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [streamUrl]);

    // Show "Up Next" toast when video is > 95% or with 30s left
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTime = () => {
            if (video.duration) {
                const pct = (video.currentTime / video.duration) * 100;
                setProgress(pct);

                // Show "Up Next" toast if we have a next program and we're near the end
                if (nextProgram && (pct > 95 || (video.duration - video.currentTime < 30))) {
                    setShowUpNext(true);
                } else {
                    setShowUpNext(false);
                }
            }
        };

        video.addEventListener("timeupdate", onTime);
        return () => video.removeEventListener("timeupdate", onTime);
    }, [nextProgram]);

    // ── Keyboard Navigation ───────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!document.fullscreenElement && document.activeElement !== containerRef.current) return;
            if (e.key === "ArrowUp") { e.preventDefault(); onNext?.(); }
            else if (e.key === "ArrowDown") { e.preventDefault(); onPrev?.(); }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onNext, onPrev]);

    const attachSource = useCallback((url: string) => {
        const video = videoRef.current;
        if (!video || !url) return;
        setHasError(false);
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

        if (url.includes(".m3u8")) {
            if (Hls.isSupported()) {
                const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
                        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
                        else setHasError(true);
                    }
                });
                hlsRef.current = hls;
                setIsLive(true);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
                video.play().catch(() => { });
                setIsLive(true);
            }
        } else {
            video.src = url;
            video.play().catch(() => { });
            setIsLive(false);
        }
    }, []);

    useEffect(() => {
        if (streamUrl) attachSource(streamUrl);
        return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
    }, [streamUrl, attachSource]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => { setIsPlaying(true); setHasStartedPlaying(true); };
        const onPause = () => setIsPlaying(false);
        const onError = () => setHasError(true);
        const onEnded = () => {
            if (playlist && playlist.length > 0) {
                currentPlaylistIndex.current = (currentPlaylistIndex.current + 1) % playlist.length;
                attachSource(playlist[currentPlaylistIndex.current]);
            }
        };
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("error", onError);
        video.addEventListener("ended", onEnded);
        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("error", onError);
            video.removeEventListener("ended", onEnded);
        };
    }, [playlist, attachSource]);

    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isPlaying) hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }, [isPlaying]);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => { }); else v.pause();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setIsMuted(v.muted);
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen();
    };

    if (!streamUrl || hasError) {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center">
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", hasError ? "bg-red-500/10" : "bg-white/5")}>
                    {hasError ? <Zap className="w-8 h-8 text-red-500" /> : <Tv className="w-8 h-8 text-white/20" />}
                </div>
                <p className="text-white/50 text-sm font-bold uppercase tracking-widest">{hasError ? "Stream Unavailable" : "Broadcast Offline"}</p>
            </div>
        );
    }

    const accentBg = accentColor === "yellow" ? "bg-yellow-500" : accentColor === "amber" ? "bg-amber-600" : accentColor === "purple" ? "bg-purple-500" : "bg-red-600";
    const accentText = accentColor === "yellow" ? "text-yellow-500" : accentColor === "amber" ? "text-amber-500" : accentColor === "purple" ? "text-purple-400" : "text-red-500";
    const accentBorder = accentColor === "yellow" ? "border-yellow-600/40" : accentColor === "amber" ? "border-amber-600/40" : accentColor === "purple" ? "border-purple-500/40" : "border-red-500/40";

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onMouseMove={resetHideTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
            className="relative w-full h-full bg-black overflow-hidden group cursor-pointer outline-none"
        >
            <video ref={videoRef} poster={posterUrl} muted={isMuted} playsInline autoPlay className="w-full h-full object-contain pointer-events-none" />

            <TuneInOverlay channelName={channelName} channelNumber={channelNumber} visible={showTuneIn} accent={accentColor} />
            <UpNextToast nextFilm={nextProgram} visible={showUpNext} accent={accentColor} />

            {/* Now Playing Metadata (Dynamic Slide-in) */}
            {currentProgram && (
                <div className={cn(
                    "absolute top-8 left-8 z-40 transition-all duration-700 max-w-lg",
                    showControls || showTuneIn ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"
                )}>
                    <div className="flex items-start gap-4 p-4 bg-black/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg", accentBg)}>
                            {channelLogo ? <img src={channelLogo} alt={channelName} className="w-8 h-8 object-contain" /> : <Tv className="w-8 h-8 text-white" />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Radio className={cn("w-3 h-3 animate-pulse", accentText)} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", accentText)}>Now Playing • CH {channelNumber || 1}</span>
                            </div>
                            <h3 className="text-xl font-black text-white leading-tight truncate">{currentProgram.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-bold">
                                {currentProgram.year && <span>{currentProgram.year}</span>}
                                {currentProgram.director && <><span>•</span><span>{currentProgram.director}</span></>}
                                <span className={cn("px-1.5 py-0.5 rounded text-[9px]", accentBg, "text-white")}>FAST</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Program Progress Bar */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-50 transition-all cursor-pointer group/progress",
                showControls ? "opacity-100 h-2" : "opacity-0"
            )}>
                <div
                    className={cn("h-full transition-all relative", accentBg)}
                    style={{ width: `${progress}%` }}
                >
                    <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-2xl scale-0 group-hover/progress:scale-100 transition-transform", accentBg)} />
                </div>
            </div>

            {/* Custom Control Bar */}
            <div className={cn("absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none", showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <div className="bg-gradient-to-t from-black/95 via-black/40 to-transparent pt-32 pb-8 px-10 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={togglePlay}
                            className="text-white hover:scale-110 transition-transform active:scale-95 shadow-2xl"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-10 h-10 fill-white" /> : <Play className="w-10 h-10 fill-white" />}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }}
                            className="text-white/60 hover:text-white transition-colors"
                            title="Toggle Chat"
                        >
                            <MessageCircle className="w-8 h-8" />
                        </button>

                        <div className="flex items-center gap-3 group/volume">
                            <button
                                onClick={toggleMute}
                                className="text-white/60 hover:text-white transition-colors"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                            </button>
                            <div className="w-0 group-hover:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white transition-all" style={{ width: `${volume * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end mr-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Live</span>
                            </div>
                        </div>
                        <button
                            onClick={toggleFullscreen}
                            className="text-white/60 hover:text-white transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <Minimize className="w-8 h-8" /> : <Maximize className="w-8 h-8" />}
                        </button>
                    </div>
                </div>

                {/* Quick Navigation Overlays */}
                <div className={cn("absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 transition-all duration-300", showControls ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none")}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/btn"
                        title="Next Channel"
                    >
                        <ChevronUp className="w-7 h-7 text-white/40 group-hover/btn:text-white" />
                    </button>
                    <div className="flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                        className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/btn"
                        title="Previous Channel"
                    >
                        <ChevronDown className="w-7 h-7 text-white/40 group-hover/btn:text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}
