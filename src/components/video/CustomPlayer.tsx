"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    PictureInPicture, Cast, Maximize2, AlertCircle, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPlayerProps {
    src: string;
    srcH264?: string;
    poster?: string;
    transcodeStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

export function CustomPlayer({ src, srcH264, poster }: CustomPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

    // Playback State (Default to optimized source if available)
    const [qualityMode, setQualityMode] = useState<'master' | 'optimized'>(srcH264 ? 'optimized' : 'master');
    const [activeSrc, setActiveSrc] = useState(srcH264 || src);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [hasEnded, setHasEnded] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);
    const [qualityBadge, setQualityBadge] = useState<string | null>(null);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(0);

    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Video.js
    useEffect(() => {
        if (!videoRef.current) return;

        const isHLS = activeSrc.includes('.m3u8');
        const player = videojs(videoRef.current, {
            controls: false, // We use custom UI
            autoplay: false,
            preload: "auto",
            fluid: false,
            playsinline: true,
            sources: [{
                src: activeSrc,
                type: isHLS ? 'application/x-mpegURL' : 'video/mp4'
            }],
        }, () => {
            playerRef.current = player;
            console.log("Enterprise Video.js Player Ready");
        });

        // Event Listeners
        player.on('play', () => setIsPlaying(true));
        player.on('pause', () => setIsPlaying(false));
        player.on('ended', () => {
            setIsPlaying(false);
            setHasEnded(true);
            setShowControls(true);
        });
        player.on('timeupdate', () => {
            if (!isDragging) setCurrentTime(player.currentTime() || 0);
        });
        player.on('loadedmetadata', () => {
            setDuration(player.duration() || 0);
            const w = player.videoWidth();
            const h = player.videoHeight();
            if (w >= 3840 || h >= 2160) setQualityBadge("4K");
            else if (w >= 1920 || h >= 1080) setQualityBadge("HD");
            else setQualityBadge(null);
        });
        player.on('waiting', () => setIsBuffering(true));
        player.on('playing', () => {
            setIsBuffering(false);
            setHasStartedPlaying(true);
            setPlaybackError(null);
        });
        player.on('error', () => {
            setIsBuffering(false);
            const currentSrc = player.currentSrc();
            // If H264 failed and we have an original source that is different, try falling back
            if (activeSrc === srcH264 && src && src !== srcH264) {
                console.log("H264 playback failed, falling back to original source");
                setActiveSrc(src);
                setPlaybackError(null);
            } else {
                setPlaybackError("Playback error or format unsupported.");
            }
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    // Sync activeSrc with props changes
    useEffect(() => {
        setActiveSrc(srcH264 || src);
    }, [src, srcH264]);

    // Source Reactivity
    useEffect(() => {
        if (playerRef.current && activeSrc) {
            const isHLS = activeSrc.includes('.m3u8');
            playerRef.current.src({
                src: activeSrc,
                type: isHLS ? 'application/x-mpegURL' : 'video/mp4'
            });
        }
    }, [activeSrc]);

    // Update Progress Bar CSS
    useEffect(() => {
        if (progressBarRef.current) {
            const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
            progressBarRef.current.style.setProperty('--progress-percent', `${pct}%`);
        }
    }, [currentTime, duration]);

    // Handle CSS Fullscreen (Mobile/iOS)
    useEffect(() => {
        const handleResize = () => { if (isCssFullscreen) setWindowHeight(window.innerHeight); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCssFullscreen]);

    useEffect(() => {
        if (!isCssFullscreen) document.body.style.overflow = '';
        if (containerRef.current && isCssFullscreen) {
            containerRef.current.style.setProperty('--window-height', `${windowHeight}px`);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isCssFullscreen, windowHeight]);

    // Auto-hide controls
    useEffect(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying, hasEnded]);

    const resetControls = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    };

    // Web Audio API Setup
    const setupAudioContext = () => {
        if (audioContextRef.current) return;
        const video = videoRef.current;
        if (!video) return;

        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const source = ctx.createMediaElementSource(video);

            // Studio Grade Compressor
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.value = -24; // Compress loud spikes
            compressor.knee.value = 30; // Smooth transition
            compressor.ratio.value = 12; // Heavy compression for vocal clarity
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            // Optional: Gain node to boost overall volume after compression
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
    };

    const togglePlay = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (playerRef.current) {
            resetControls();

            // Initialize AudioContext on first user interaction for policy compliance
            if (!audioContextRef.current) setupAudioContext();
            else if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();

            if (playerRef.current.paused() || hasEnded) {
                try {
                    await playerRef.current.play();
                    setHasEnded(false);
                } catch (e) { }
            } else {
                playerRef.current.pause();
            }
        }
    }, [hasEnded]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.currentTime(time);
            setCurrentTime(time);
        }
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (playerRef.current) {
            const muted = !playerRef.current.muted();
            playerRef.current.muted(muted);
            setIsMuted(muted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        if (playerRef.current) {
            playerRef.current.volume(newVol);
            if (newVol === 0) {
                playerRef.current.muted(true);
                setIsMuted(true);
            } else if (isMuted) {
                playerRef.current.muted(false);
                setIsMuted(false);
            }
        }
        setVolume(newVol);
    };

    const toggleQuality = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!srcH264) return;
        const newMode = qualityMode === 'master' ? 'optimized' : 'master';
        setQualityMode(newMode);
        setActiveSrc(newMode === 'master' ? src : srcH264);
    };

    const toggleFullscreen = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            const enter = !isCssFullscreen;
            setIsCssFullscreen(enter);
            setIsZoomed(enter);
            document.body.style.overflow = enter ? 'hidden' : '';
        } else if (playerRef.current) {
            if (playerRef.current.isFullscreen()) {
                playerRef.current.exitFullscreen();
                setIsFullscreen(false);
            } else {
                playerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        }
    };

    const togglePip = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    };

    const formatTime = (time: number) => {
        if (!isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "group relative bg-black overflow-hidden flex flex-col items-center justify-center",
                isCssFullscreen ? "fixed inset-0 z-[10000] w-full dynamic-height" : "w-full h-full"
            )}
            onMouseMove={resetControls}
            onClick={togglePlay}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Video.js Container */}
            <div data-vjs-player className="w-full h-full absolute inset-0">
                <video
                    ref={videoRef}
                    className={cn(
                        "video-js vjs-default-skin w-full h-full",
                        (isZoomed || isCssFullscreen) ? "vjs-zoomed" : "vjs-contain"
                    )}
                    crossOrigin="anonymous"
                />
            </div>

            {/* Premium Quality Badge */}
            {(qualityBadge) && hasStartedPlaying && (
                <div className="absolute top-4 right-4 z-[40] pointer-events-none">
                    <div className={cn(
                        "px-3 py-1.5 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.1em] border shadow-2xl flex items-center gap-2",
                        qualityMode === 'master' ? "bg-j-gold/20 border-j-gold/40 text-j-gold" : "bg-black/40 border-white/10 text-white/70"
                    )}>
                        <span className="opacity-60">QUALITY</span>
                        <span className="drop-shadow-sm">{qualityBadge} {qualityMode === 'master' ? 'MASTER' : 'OPTIMIZED'}</span>
                        {qualityMode === 'master' && <span className="flex h-1.5 w-1.5 rounded-full bg-j-gold animate-pulse" />}
                    </div>
                </div>
            )}

            {/* Poster Overlay */}
            {poster && (!hasStartedPlaying || hasEnded) && (
                <div className="absolute inset-0 z-[10] pointer-events-none">
                    <Image
                        src={poster}
                        alt="Video thumbnail"
                        fill
                        priority
                        className={cn("object-contain", isZoomed && "object-cover")}
                    />
                </div>
            )}

            {/* Buffering Indicator */}
            {isBuffering && hasStartedPlaying && (
                <div className="absolute inset-0 z-[20] flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Error Banner */}
            {playbackError && (
                <div className="absolute top-4 left-4 right-4 z-[50] flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 flex-1">{playbackError}</span>
                    <button onClick={() => setPlaybackError(null)} className="text-gray-500 hover:text-white p-1"><span className="text-xs">✕</span></button>
                </div>
            )}

            {/* Custom Controls UI (Glassmorphism) */}
            <div
                className={cn(
                    "absolute inset-0 z-[60] bg-transparent transition-opacity duration-300 flex flex-col justify-end pointer-events-none",
                    showControls ? "opacity-100 visible" : "opacity-0 invisible"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full px-4 pb-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Progress Bar */}
                    <div ref={progressBarRef} className="relative group/progress h-2 mb-4 cursor-pointer w-full">
                        <div className="absolute inset-0 bg-white/30 rounded-full overflow-hidden" />
                        <input
                            type="range"
                            title="Seek video"
                            placeholder="Seek video"
                            min="0"
                            max={isFinite(duration) ? duration : 100}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            onInput={handleSeek}
                            onPointerDown={() => { setIsDragging(true); resetControls(); }}
                            onPointerUp={(e) => {
                                setIsDragging(false);
                                if (playerRef.current) playerRef.current.currentTime(parseFloat(e.currentTarget.value));
                            }}
                            className="absolute top-[-12px] left-0 w-full h-8 opacity-0 z-20 cursor-pointer touch-none"
                        />
                        <div className="absolute top-0 left-0 h-full bg-j-red rounded-full z-10 pointer-events-none progress-fill" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md z-10 pointer-events-none scale-0 group-hover/progress:scale-100 transition-transform left-[var(--progress-percent)]" />
                    </div>

                    {/* Bottom Row Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="text-white hover:text-j-red transition-colors p-4 -m-4 relative z-50">
                                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                            </button>
                            <div className="flex items-center gap-2 group/volume">
                                <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors">
                                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 flex items-center">
                                    <input type="range" title="Volume" placeholder="Volume" aria-label="Volume" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white" />
                                </div>
                            </div>
                            <div className="text-white/80 text-sm font-medium font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }} className="text-white hover:text-j-gold transition-colors p-4 -m-4 relative z-50" title={isZoomed ? "Original Aspect" : "Zoom to Fill"}>
                                <Maximize2 className="w-6 h-6" />
                            </button>
                            {srcH264 && (
                                <button onClick={toggleQuality} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border", qualityMode === 'master' ? "bg-j-gold/20 text-j-gold border-j-gold/50 shadow-lg shadow-j-gold/10" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10")}>
                                    <Settings className={cn("w-3.5 h-3.5", qualityMode === 'master' && "animate-spin-slow")} />
                                    {qualityMode === 'master' ? 'Ultra HD' : 'Optimized'}
                                </button>
                            )}
                            <button onClick={togglePip} className="text-white hover:text-white/80 transition-colors p-4 -m-4 relative z-50" title="Picture in Picture" aria-label="Picture in Picture">
                                <PictureInPicture className="w-6 h-6" />
                            </button>
                            <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors p-4 -m-4 relative z-50">
                                {isFullscreen || isCssFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
