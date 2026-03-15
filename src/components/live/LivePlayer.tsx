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
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentPlaylistIndex = useRef(0);

    // Audio Context Refs (Studio Grade Audio)
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

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
    const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Standard Audio Setup
    const setupAudioContext = useCallback(() => {
        if (audioContextRef.current) return;
        const video = videoRef.current;
        if (!video) return;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const source = ctx.createMediaElementSource(video);

            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            const gainNode = ctx.createGain();
            gainNode.gain.value = 1.5;

            source.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(ctx.destination);

            audioContextRef.current = ctx;
            sourceNodeRef.current = source;
            compressorRef.current = compressor;
        } catch (err) {
            console.error("Web Audio API not supported", err);
        }
    }, []);

    // Initialize Video.js
    useEffect(() => {
        if (!videoRef.current) return;

        const player = videojs(videoRef.current, {
            controls: false,
            autoplay: true,
            muted: true,
            preload: "auto",
            fluid: false,
            playsinline: true,
            html5: {
                vhs: { overrideNative: true },
                nativeAudioTracks: false,
                nativeVideoTracks: false
            }
        }, () => {
            playerRef.current = player;
            console.log("Enterprise Live Player Ready");
        });

        player.on('play', () => {
            setIsPlaying(true);
            setHasStartedPlaying(true);
        });
        player.on('pause', () => setIsPlaying(false));
        player.on('timeupdate', () => {
            const dur = player.duration();
            const cur = player.currentTime();
            if (dur && cur) {
                const pct = (cur / dur) * 100;
                setProgress(pct);
                if (progressBarRef.current) {
                    progressBarRef.current.style.width = `${pct}%`;
                }
                if (nextProgram && (pct > 95 || (dur - cur < 30))) {
                    setShowUpNext(true);
                } else {
                    setShowUpNext(false);
                }
            }
        });
        player.on('error', () => setHasError(true));
        player.on('ended', () => {
            if (playlist && playlist.length > 0) {
                currentPlaylistIndex.current = (currentPlaylistIndex.current + 1) % playlist.length;
                player.src({ src: playlist[currentPlaylistIndex.current], type: playlist[currentPlaylistIndex.current].includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' });
            }
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [playlist, nextProgram]);

    // Handle streamUrl changes
    useEffect(() => {
        if (playerRef.current && streamUrl) {
            playerRef.current.src({
                src: streamUrl,
                type: streamUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
            });
            setIsLive(streamUrl.includes('.m3u8'));
        }
    }, [streamUrl]);

    // UI Logic
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isPlaying) hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }, [isPlaying]);

    const togglePlay = () => {
        const player = playerRef.current;
        if (!player) return;

        if (player.paused()) player.play().catch(() => { });
        else player.pause();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playerRef.current) return;
        const muted = !playerRef.current.muted();
        playerRef.current.muted(muted);
        setIsMuted(muted);
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen();
    };

    const togglePip = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        try {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else if (videoRef.current) await videoRef.current.requestPictureInPicture();
        } catch (error) {
            console.error("PiP failed:", error);
        }
    };

    const handleCast = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setupAudioContext(); // Ensure audio context is ready on interaction
        const videoElement = videoRef.current as unknown as HTMLVideoElementWithWebKit;
        if (videoElement?.webkitShowPlaybackTargetPicker) {
            videoElement.webkitShowPlaybackTargetPicker();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const player = playerRef.current;
        const bar = progressBarRef.current?.parentElement;
        if (!player || !bar) return;

        const rect = bar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * player.duration();
        player.currentTime(newTime);
        setProgress(pos * 100);
    };

    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const player = playerRef.current;
        const bar = e.currentTarget;
        if (!player || !bar) return;

        const rect = bar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        player.volume(pos);
        setVolume(pos);
        if (pos > 0 && isMuted) {
            player.muted(false);
            setIsMuted(false);
        }
    };

    const toggleSubtitles = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const player = playerRef.current;
        if (!player) return;
        const tracks = player.textTracks();
        let enabled = false;
        for (let i = 0; i < tracks.length; i++) {
            const track = (tracks as any)[i];
            if (!track) continue;
            if (track.mode === 'showing') {
                track.mode = 'disabled';
            } else {
                track.mode = 'showing';
                enabled = true;
            }
        }
        setSubtitlesEnabled(enabled);
    };

    const toggleZoom = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsZoomed(prev => !prev);
    };

    useEffect(() => {
        if (volumeBarRef.current) {
            volumeBarRef.current.style.width = `${volume * 100}%`;
        }
    }, [volume]);

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

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onMouseMove={resetHideTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
            className="relative w-full h-full bg-black overflow-hidden group cursor-pointer outline-none"
        >
            <div data-vjs-player className="w-full h-full absolute inset-0">
                <video
                    ref={videoRef}
                    className={cn(
                        "video-js vjs-default-skin w-full h-full",
                        isZoomed ? "vjs-zoomed" : "vjs-contain"
                    )}
                    playsInline
                    crossOrigin="anonymous"
                />
            </div>

            <UpNextToast nextFilm={nextProgram} visible={showUpNext} accent={accentColor} />

            {/* Program Progress Bar */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 z-50 transition-all cursor-pointer group/progress",
                    showControls ? "opacity-100 h-2" : "opacity-0"
                )}
                onClick={handleSeek}
            >
                <div
                    ref={progressBarRef}
                    className={cn("h-full transition-all relative", accentBg)}
                >
                    <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-2xl scale-0 group-hover/progress:scale-100 transition-transform", accentBg)} />
                </div>
            </div>

            {/* Premium Control Bar */}
            <div className={cn("absolute bottom-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none", showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                <div
                    className="bg-gradient-to-t from-black/95 via-black/40 to-transparent pt-16 md:pt-32 pb-4 md:pb-8 px-4 md:px-10 flex items-center justify-between pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-4 md:gap-8">
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="text-white hover:scale-110 transition-transform active:scale-95 shadow-2xl"
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-white" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-white" />}
                        </button>

                        <button onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }} className="text-white/60 hover:text-white transition-colors" title="Toggle Chat">
                            <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                        </button>

                        <div className="flex items-center gap-3 group/volume">
                            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors" title={isMuted ? "Unmute" : "Mute"}>
                                {isMuted ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
                            </button>
                            <div
                                onClick={handleVolumeClick}
                                className="w-0 group-hover:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                            >
                                <div ref={volumeBarRef} className="h-full bg-white transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={toggleZoom} className={cn("transition-colors", isZoomed ? "text-white" : "text-white/60 hover:text-white")}>
                            {isZoomed ? <ZoomOut className="w-6 h-6 md:w-8 md:h-8" /> : <ZoomIn className="w-6 h-6 md:w-8 md:h-8" />}
                        </button>
                        <button onClick={toggleSubtitles} className={cn("transition-colors", subtitlesEnabled ? "text-white" : "text-white/60 hover:text-white")} title="Toggle Subtitles">
                            <Subtitles className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button onClick={handleCast} className="text-white/60 hover:text-white transition-colors" title="Cast to device">
                            <Cast className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button onClick={togglePip} className="text-white/60 hover:text-white transition-colors" title="Picture in Picture">
                            <PictureInPicture className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors" title="Fullscreen">
                            {isFullscreen ? <Minimize className="w-6 h-6 md:w-8 md:h-8" /> : <Maximize className="w-6 h-6 md:w-8 md:h-8" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
