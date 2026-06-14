"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    PictureInPicture, Maximize2, AlertCircle, Settings, Cast
} from "lucide-react";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

interface HTMLVideoElementWithPlaybackTarget extends HTMLVideoElement {
    webkitShowsPlaybackTargetPicker?: boolean;
    webkitShowPlaybackTargetPicker?: () => void;
    webkitSupportsPresentationMode?: (mode: string) => boolean;
    webkitPresentationMode?: string;
    webkitSetPresentationMode?: (mode: string) => void;
}

interface CustomPlayerProps {
    src: string;
    srcH264?: string;
    poster?: string;
    videoId?: string;
    transcodeStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    onPlayStart?: () => void;
}

export function CustomPlayer({ src, srcH264, poster, videoId, transcodeStatus, onPlayStart }: CustomPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsInstanceRef = useRef<Hls | null>(null);

    const [prevVideoId, setPrevVideoId] = useState(videoId);
    const [hasIncrementedView, setHasIncrementedView] = useState(false);

    if (videoId !== prevVideoId) {
        setPrevVideoId(videoId);
        setHasIncrementedView(false);
    }

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

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(0);
    const [isCastAvailable, setIsCastAvailable] = useState(false);
    const [isPipAvailable, setIsPipAvailable] = useState(true);

    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const srcReadyRef = useRef(false);
    const MAX_RETRIES = 3;

    // Netflix-grade Buffering States & Timeouts
    const [showSpinner, setShowSpinner] = useState(false);
    const [showQualitySuggestion, setShowQualitySuggestion] = useState(false);
    const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce Buffer Spinner & Stall Suggestion Hook
    useEffect(() => {
        if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
        if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);

        let clearStateTimeout: NodeJS.Timeout | null = null;

        if (isBuffering && isPlaying) {
            // Wait 1200ms of consecutive stall before showing spinner to prevent flashing on slow progressive streams
            bufferTimeoutRef.current = setTimeout(() => {
                setShowSpinner(true);

                // If in master (raw 4K/UHD) quality mode and we buffer for > 5 seconds, show optimized recommendation
                if (qualityMode === 'master' && srcH264) {
                    stallTimeoutRef.current = setTimeout(() => {
                        setShowQualitySuggestion(true);
                    }, 5000);
                }
            }, 1200);
        } else {
            // Defer setState execution asynchronously to avoid synchronous cascading updates in effects
            clearStateTimeout = setTimeout(() => {
                setShowSpinner(prev => prev ? false : prev);
                setShowQualitySuggestion(prev => prev ? false : prev);
            }, 0);
        }

        return () => {
            if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
            if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
            if (clearStateTimeout) clearTimeout(clearStateTimeout);
        };
    }, [isBuffering, isPlaying, qualityMode, srcH264]);

    const sendTelemetry = useCallback(async (eventType: string, details: Record<string, unknown> = {}) => {
        if (!videoId) return;
        try {
            const guestId = typeof window !== 'undefined' ? localStorage.getItem("jtube_guest_id") : '';
            await fetch('/api/telemetry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventType,
                    videoId,
                    guestId,
                    details
                })
            });
        } catch (e) {
            console.warn("Failed to send player telemetry:", e);
        }
    }, [videoId]);

    const resolvedSrc = React.useMemo(() => {
        if (typeof window === "undefined") return activeSrc;
        if (activeSrc.startsWith("/")) {
            return `${window.location.origin}${activeSrc}`;
        }
        return activeSrc;
    }, [activeSrc]);

    const [prevProps, setPrevProps] = useState({ src, srcH264 });
    if (src !== prevProps.src || srcH264 !== prevProps.srcH264) {
        setPrevProps({ src, srcH264 });
        const nextSrc = srcH264 || src;
        setActiveSrc(nextSrc);
    }

    const resetControls = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying, hasEnded]);

    const togglePlay = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            resetControls();
            if (videoRef.current.paused || hasEnded) {
                try {
                    await videoRef.current.play();
                    setHasEnded(false);
                } catch { }
            } else {
                videoRef.current.pause();
            }
        }
    }, [hasEnded, resetControls]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            const muted = !videoRef.current.muted;
            videoRef.current.muted = muted;
            setIsMuted(muted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVol;
            if (newVol === 0) {
                videoRef.current.muted = true;
                setIsMuted(true);
            } else if (isMuted) {
                videoRef.current.muted = false;
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
        sendTelemetry('quality_change', { from: qualityMode, to: newMode });
        
        if (videoRef.current) {
            const wasPlaying = !videoRef.current.paused;
            const currentTime = videoRef.current.currentTime;
            
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.currentTime = currentTime;
                    if (wasPlaying) videoRef.current.play().catch(()=>{});
                }
            }, 50);
        }
    };

    const toggleFullscreen = useCallback(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
        if (isIOS) {
            const enter = !isCssFullscreen;
            setIsCssFullscreen(enter);
            setIsZoomed(enter);
            document.body.style.overflow = enter ? 'hidden' : '';
        } else if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                setIsFullscreen(false);
            } else {
                containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }
        }
    }, [isCssFullscreen]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const remoteVideo = video as HTMLVideoElementWithPlaybackTarget;

        // Check Remote Playback (Chromecast/AirPlay) availability
        try {
            if (remoteVideo.remote && remoteVideo.remote.watchAvailability) {
                let callbackId: number | undefined;
                remoteVideo.remote.watchAvailability((available: boolean) => {
                    setIsCastAvailable(available);
                }).then((id: number) => {
                    callbackId = id;
                }).catch(() => {
                    // If detection fails, fallback to showing cast icon if API is present
                    setTimeout(() => setIsCastAvailable(true), 0);
                });

                return () => {
                    if (callbackId !== undefined && remoteVideo.remote.cancelWatchAvailability) {
                        remoteVideo.remote.cancelWatchAvailability(callbackId).catch(() => {});
                    }
                };
            } else if (remoteVideo.webkitShowsPlaybackTargetPicker) {
                // Safari legacy AirPlay fallback
                setTimeout(() => setIsCastAvailable(true), 0);
            }
        } catch (error) {
            console.warn("[CustomPlayer] RemotePlayback watchAvailability error:", error);
            // Default to true so they can still try prompting if they click
            setTimeout(() => setIsCastAvailable(true), 0);
        }

        // Check Picture-in-Picture availability
        try {
            const supportsPip = 
                document.pictureInPictureEnabled || 
                (remoteVideo.webkitSupportsPresentationMode && 
                 remoteVideo.webkitSupportsPresentationMode("picture-in-picture")) ||
                (typeof remoteVideo.webkitSetPresentationMode === "function") ||
                ('pictureInPictureEnabled' in document);
            
            setIsPipAvailable(!!supportsPip);
        } catch (error) {
            console.warn("[CustomPlayer] Picture-in-Picture check failed:", error);
            setIsPipAvailable(true);
        }
    }, []);

    const toggleCast = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current as HTMLVideoElementWithPlaybackTarget;
        if (!video) return;

        if (video.remote) {
            try {
                await video.remote.prompt();
            } catch (error) {
                console.error("Casting failed via Remote Playback:", error);
            }
        } else if (video.webkitShowPlaybackTargetPicker) {
            try {
                video.webkitShowPlaybackTargetPicker();
            } catch (error) {
                console.error("Casting failed via Webkit AirPlay:", error);
            }
        }
    };

    const togglePip = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const video = videoRef.current as HTMLVideoElementWithPlaybackTarget;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (video.requestPictureInPicture) {
                await video.requestPictureInPicture();
            } else if (typeof video.webkitSetPresentationMode === "function") {
                const newMode = video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture";
                video.webkitSetPresentationMode(newMode);
            }
        } catch (error) {
            console.error("Failed to toggle Picture-in-Picture:", error);
        }
    };

    const formatTime = (time: number) => {
        if (!isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (progressBarRef.current) {
            const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
            progressBarRef.current.style.setProperty('--progress-percent', `${pct}%`);
        }
    }, [currentTime, duration]);

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

    useEffect(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying, hasEnded]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
            const video = videoRef.current;
            if (!video) return;

            switch (e.key) {
                case ' ':
                case 'k':
                case 'K':
                    e.preventDefault();
                    if (video.paused || hasEnded) {
                        video.play()?.catch(() => {});
                        setHasEnded(false);
                    } else {
                        video.pause();
                    }
                    resetControls();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    const muted = !video.muted;
                    video.muted = muted;
                    setIsMuted(muted);
                    resetControls();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 5);
                    resetControls();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
                    resetControls();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    { const newVol = Math.min(1, video.volume + 0.1);
                    video.volume = newVol;
                    setVolume(newVol);
                    if (video.muted) { video.muted = false; setIsMuted(false); }
                    resetControls(); }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    { const newVol2 = Math.max(0, video.volume - 0.1);
                    video.volume = newVol2;
                    setVolume(newVol2);
                    resetControls(); }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasEnded, resetControls, toggleFullscreen]);

    const loadSource = useCallback((srcUrl: string) => {
        const video = videoRef.current;
        if (!video || !srcUrl) return;

        // Clean up previous HLS instance if it exists to prevent memory leaks and duplicate attachment
        if (hlsInstanceRef.current) {
            hlsInstanceRef.current.destroy();
            hlsInstanceRef.current = null;
        }

        // Reset state for new source
        retryCountRef.current = 0;
        srcReadyRef.current = false;
        setPlaybackError(null);
        setIsBuffering(true);

        if (srcUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    startLevel: -1,
                    capLevelToPlayerSize: true,
                    maxBufferLength: 45, // Deeper buffer for VOD
                    maxMaxBufferLength: 90,
                    enableWorker: true,
                    lowLatencyMode: false, // Explicitly disable low latency; this causes spinning circles in VOD
                    backBufferLength: 15,
                });
                hls.loadSource(srcUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    srcReadyRef.current = true;
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                hls.destroy();
                                setIsBuffering(false);
                                setPlaybackError("Playback error — tap Retry.");
                                break;
                        }
                    }
                });
                hlsInstanceRef.current = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = srcUrl;
                srcReadyRef.current = true;
            } else {
                setPlaybackError("HLS not supported in this browser.");
            }
        } else {
            video.src = srcUrl;
            video.load(); // Explicitly force the browser to reload the media resource
            srcReadyRef.current = true;
        }
    }, []);

    const handleRetry = useCallback(() => {
        setPlaybackError(null);
        setIsBuffering(true);
        const video = videoRef.current;
        if (video) {
            video.pause();
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
            loadSource(resolvedSrc);
            video.load(); // Force native reload to clear internal browser errors
            video.play().catch(() => {}); // Re-trigger playback post-load
        }
    }, [resolvedSrc, loadSource]);

    useEffect(() => {
        loadSource(resolvedSrc);
        return () => {
            if (hlsInstanceRef.current) {
                hlsInstanceRef.current.destroy();
                hlsInstanceRef.current = null;
            }
        };
    }, [resolvedSrc, loadSource]);

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
            <div className="w-full h-full absolute inset-0">
                <video
                    ref={videoRef}
                    className={cn(
                        "w-full h-full",
                        (isZoomed || isCssFullscreen) ? "object-cover" : "object-contain"
                    )}
                    preload="auto"
                    playsInline
                    autoPlay={false}
                    onPlay={() => {
                        setIsPlaying(true);
                        sendTelemetry('playback_start', { quality: qualityMode });
                        if (!hasIncrementedView) {
                            setHasIncrementedView(true);
                            onPlayStart?.();
                        }
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        sendTelemetry('playback_stop', {
                            offsetSeconds: videoRef.current?.currentTime || 0,
                            durationSeconds: videoRef.current?.duration || 0
                        });
                    }}
                    onEnded={() => {
                        setIsPlaying(false);
                        setHasEnded(true);
                        setShowControls(true);
                        sendTelemetry('watch_complete', { durationSeconds: videoRef.current?.duration || 0 });
                    }}
                    onTimeUpdate={(e) => {
                        if (!isDragging) setCurrentTime(e.currentTarget.currentTime);
                    }}
                    onLoadedMetadata={(e) => {
                        setDuration(e.currentTarget.duration);
                    }}
                    onWaiting={() => {
                        setIsBuffering(true);
                        sendTelemetry('buffering_start', { offsetSeconds: videoRef.current?.currentTime || 0 });
                    }}
                    onPlaying={() => {
                        setIsBuffering(false);
                        setHasStartedPlaying(true);
                        setPlaybackError(null);
                        sendTelemetry('buffering_end', { offsetSeconds: videoRef.current?.currentTime || 0 });
                    }}
                    onError={() => {
                        // Only handle errors after a src has actually been set
                        if (!srcReadyRef.current) return;
                        
                        const currentSrc = videoRef.current?.src || resolvedSrc;
                        let nextSrc = currentSrc;
                        if (currentSrc.includes('media.culturequest.vip')) {
                            nextSrc = currentSrc.replace('media.culturequest.vip', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                        }

                        sendTelemetry('playback_error', {
                            error: videoRef.current?.error?.message || "HTML5 video error",
                            code: videoRef.current?.error?.code || 0
                        });

                        if (retryCountRef.current < MAX_RETRIES) {
                            retryCountRef.current++;
                            const delay = retryCountRef.current * 1500;
                            setTimeout(() => {
                                if (videoRef.current) {
                                    videoRef.current.src = nextSrc;
                                    videoRef.current.load();
                                }
                            }, delay);
                        } else {
                            setIsBuffering(false);
                            setPlaybackError("Playback error — tap Retry.");
                        }
                    }}
                />
            </div>
 
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

            {showSpinner && (
                <div className="absolute inset-0 z-[20] flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {showQualitySuggestion && (
                <div className="absolute inset-x-4 top-16 z-[70] flex justify-center pointer-events-auto">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleQuality();
                        }}
                        className="bg-black/95 hover:bg-black text-white backdrop-blur-md border border-j-gold/40 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-3 transition-all duration-300 text-xs font-semibold scale-95 hover:scale-100"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-j-gold animate-ping" />
                        <span>{"Connection slow for Ultra HD? Tap here to switch to **Optimized** mode for buffer-free playback."}</span>
                    </button>
                </div>
            )}

            {playbackError && (
                <div className="absolute top-4 left-4 right-4 z-[50] flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 flex-1">{playbackError}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleRetry(); }} className="text-amber-400 hover:text-amber-300 px-2 py-1 text-xs font-bold uppercase tracking-wider">{"Retry"}</button>
                    <button onClick={(e) => { e.stopPropagation(); setPlaybackError(null); }} className="text-gray-500 hover:text-white p-1"><span className="text-xs">✕</span></button>
                </div>
            )}

            {(transcodeStatus === 'pending' || transcodeStatus === 'processing') && !srcH264 && (
                <div className="absolute top-4 left-4 z-[50] flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 backdrop-blur-md rounded-full px-4 py-1.5 pointer-events-auto">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        Processing High Quality
                        <span className="hidden sm:inline text-amber-500/70 lowercase font-medium tracking-normal">(black screen may occur on some browsers until finished)</span>
                    </span>
                </div>
            )}

            <div
                className={cn(
                    "absolute inset-0 z-[60] bg-transparent transition-opacity duration-300 flex flex-col justify-end pointer-events-none",
                    showControls ? "opacity-100 visible" : "opacity-0 invisible"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full px-4 pb-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto" onClick={(e) => e.stopPropagation()}>
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
                            onPointerDown={() => { setIsDragging(true); resetControls(); }}
                            onPointerUp={(e) => {
                                setIsDragging(false);
                                if (videoRef.current) videoRef.current.currentTime = parseFloat(e.currentTarget.value);
                            }}
                            className="absolute top-[-12px] left-0 w-full h-8 opacity-0 z-20 cursor-pointer touch-none"
                        />
                        <div className="absolute top-0 left-0 h-full bg-j-red rounded-full z-10 pointer-events-none progress-fill" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md z-10 pointer-events-none scale-0 group-hover/progress:scale-100 transition-transform left-[var(--progress-percent)]" />
                    </div>

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

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }} className="text-white hover:text-j-gold transition-colors p-3 sm:p-4 -m-3 sm:-m-4 relative z-50" title={isZoomed ? "Original Aspect" : "Zoom to Fill"}>
                                <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            {srcH264 && (
                                <button onClick={toggleQuality} className={cn("flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border", qualityMode === 'master' ? "bg-j-gold/20 text-j-gold border-j-gold/50 shadow-lg shadow-j-gold/10" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10")}>
                                    <Settings className={cn("w-3.5 h-3.5 flex-shrink-0", qualityMode === 'master' && "animate-spin-slow")} />
                                    <span className="hidden sm:inline">{qualityMode === 'master' ? 'Ultra HD' : 'Optimized'}</span>
                                    <span className="sm:hidden tracking-normal">{qualityMode === 'master' ? 'UHD' : 'SD'}</span>
                                </button>
                            )}
                            {isCastAvailable && (
                                <button onClick={toggleCast} className="text-white hover:text-white/80 transition-colors p-3 sm:p-4 -m-3 sm:-m-4 relative z-50" title="Cast Video" aria-label="Cast Video">
                                    <Cast className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                            {isPipAvailable && (
                                <button onClick={togglePip} className="text-white hover:text-white/80 transition-colors p-3 sm:p-4 -m-3 sm:-m-4 relative z-50" title="Picture in Picture" aria-label="Picture in Picture">
                                    <PictureInPicture className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            )}
                            <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors p-3 sm:p-4 -m-3 sm:-m-4 relative z-50">
                                {isFullscreen || isCssFullscreen ? <Minimize className="w-6 h-6 sm:w-7 sm:h-7" /> : <Maximize className="w-6 h-6 sm:w-7 sm:h-7" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
