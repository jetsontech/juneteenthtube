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
    SkipForward,
    PictureInPicture,
    Cast,
    Subtitles,
    ZoomIn,
    ZoomOut
} from "lucide-react";

interface HTMLVideoElementWithWebKit extends HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
    webkitEnterFullscreen?: () => void;
}
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
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const infoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentPlaylistIndex = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showUpNext, setShowUpNext] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [progress, setProgress] = useState(0);
    const [subtitlesEnabled, setSubtitlesEnabled] = useState(false); // CC State
    const [isZoomed, setIsZoomed] = useState(false);

    // ── FAST Overlay Logic ────────────────────────────
    // (TuneInOverlay removed per user request for faster switching)

    // Show "Up Next" toast when video is > 95% or with 30s left
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTime = () => {
            if (video.duration) {
                const pct = (video.currentTime / video.duration) * 100;
                setProgress(pct);

                // Update progress bar width dynamically
                if (progressBarRef.current) {
                    progressBarRef.current.style.width = `${pct}%`;
                }

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

    // Keep volume bar updated
    useEffect(() => {
        if (volumeBarRef.current) {
            volumeBarRef.current.style.width = `${volume * 100}%`;
        }
    }, [volume]);

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen();
    };

    // Toggle PiP
    const togglePip = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error("PiP failed:", error);
        }
    };

    // Handle Casting
    const handleCast = async (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!videoRef.current) return;

        const videoElement = videoRef.current as unknown as HTMLVideoElementWithWebKit;

        if (videoElement.webkitShowPlaybackTargetPicker) {
            try {
                videoElement.webkitShowPlaybackTargetPicker();
                return;
            } catch (error) {
                console.error("AirPlay failed:", error);
            }
        }

        if (videoElement.remote) {
            try {
                if (videoElement.remote.state === 'disconnected') {
                    await videoElement.remote.prompt();
                } else {
                    await videoElement.remote.prompt();
                }
            } catch (error: any) {
                if (error?.name === 'AbortError' || error?.name === 'NotAllowedError' || error?.message?.includes('dismissed')) {
                    // User cancelled
                } else {
                    console.error("Cast error:", error);
                    alert(`Casting failed: ${error?.message || "Unknown error"}`);
                }
            }
        } else {
            alert("Casting or AirPlay is not supported on this browser/device.");
        }
    };

    // Toggle Closed Captions
    const toggleSubtitles = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        const tracks = video.textTracks;
        if (tracks && tracks.length > 0) {
            // Find the primary subtitle track
            let hasEnabled = false;
            for (let i = 0; i < tracks.length; i++) {
                if (tracks[i].mode === 'showing') {
                    tracks[i].mode = 'hidden';
                } else if (!hasEnabled && tracks[i].kind === 'subtitles' || tracks[i].kind === 'captions') {
                    tracks[i].mode = 'showing';
                    hasEnabled = true;
                }
            }
            setSubtitlesEnabled(hasEnabled);
        } else {
            // Visual toggle even if no tracks found (often useful if tracks are native/burned in via stream but still want a toggle state)
            setSubtitlesEnabled(prev => !prev);
        }
    };

    // Toggle Zoom out of pillarboxes
    const toggleZoom = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsZoomed(prev => !prev);
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
            <video ref={videoRef} poster={posterUrl} muted={isMuted} playsInline autoPlay className={cn("w-full h-full pointer-events-none transition-transform duration-500", isZoomed ? "object-cover scale-[1.34]" : "object-contain scale-100")} />

            <UpNextToast nextFilm={nextProgram} visible={showUpNext} accent={accentColor} />

            {/* Program Progress Bar */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-50 transition-all cursor-pointer group/progress",
                showControls ? "opacity-100 h-2" : "opacity-0"
            )}>
                <div
                    ref={progressBarRef}
                    className={cn("h-full transition-all relative", accentBg)}
                >
                    <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-2xl scale-0 group-hover/progress:scale-100 transition-transform", accentBg)} />
                </div>
            </div>

            {/* Custom Control Bar */}
            <div className={cn("absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none", showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <div className="bg-gradient-to-t from-black/95 via-black/40 to-transparent pt-16 md:pt-32 pb-4 md:pb-8 px-4 md:px-10 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-4 md:gap-8">
                        <button
                            onClick={togglePlay}
                            className="text-white hover:scale-110 transition-transform active:scale-95 shadow-2xl"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-white" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-white" />}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }}
                            className="text-white/60 hover:text-white transition-colors"
                            title="Toggle Chat"
                        >
                            <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                        </button>

                        <div className="flex items-center gap-3 group/volume">
                            <button
                                onClick={toggleMute}
                                className="text-white/60 hover:text-white transition-colors"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
                            </button>
                            <div className="w-0 group-hover:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div ref={volumeBarRef} className="h-full bg-white transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleZoom}
                            className={cn(
                                "transition-colors",
                                isZoomed ? "text-white" : "text-white/60 hover:text-white"
                            )}
                            title={isZoomed ? "Zoom Out" : "Zoom In (Fill 4:3 content)"}
                        >
                            {isZoomed ? <ZoomOut className="w-6 h-6 md:w-8 md:h-8" /> : <ZoomIn className="w-6 h-6 md:w-8 md:h-8" />}
                        </button>
                        <button
                            onClick={toggleSubtitles}
                            className={cn(
                                "transition-colors",
                                subtitlesEnabled ? "text-white" : "text-white/60 hover:text-white"
                            )}
                            title="Closed Captions / Subtitles"
                        >
                            <Subtitles className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button
                            onClick={handleCast}
                            className="text-white/60 hover:text-white transition-colors"
                            title="Cast to Device"
                        >
                            <Cast className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button
                            onClick={togglePip}
                            className="text-white/60 hover:text-white transition-colors"
                            title="Picture-in-Picture"
                        >
                            <PictureInPicture className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="text-white/60 hover:text-white transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? <Minimize className="w-6 h-6 md:w-8 md:h-8" /> : <Maximize className="w-6 h-6 md:w-8 md:h-8" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
