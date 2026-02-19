"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    PictureInPicture,
    Cast,
    Maximize2,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPlayerProps {
    src: string;
    srcH264?: string; // Transcoded H.264 fallback (tried only if primary fails)
    poster?: string;
    transcodeStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

interface HTMLVideoElementWithWebKit extends HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
    webkitEnterFullscreen?: () => void;
}

export function CustomPlayer({ src, srcH264, poster }: CustomPlayerProps) {
    // Always try the original source first — Chrome can play most formats
    // Only fall back to H.264 if the primary source genuinely fails
    const [activeSrc, setActiveSrc] = useState(src);
    const [triedFallback, setTriedFallback] = useState(false);
    const [playbackError, setPlaybackError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasEnded, setHasEnded] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

    // NEW: Custom CSS Fullscreen state for Mobile
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(0); // Track window height for safe scaling

    // NEW: Audio & Video Quality State
    const [qualityBadge, setQualityBadge] = useState<string | null>(null);
    const [isMastered, setIsMastered] = useState(false); // Track if professional mastering is active
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

    // Progress bar ref for CSS variable
    const progressBarRef = useRef<HTMLDivElement>(null);

    // User Interaction State
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Force playsinline for iOS (React sometimes is tricky with this)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.setAttribute("playsinline", "");
            videoRef.current.setAttribute("webkit-playsinline", "");
        }
    }, []);

    // CRITICAL: Cleanup body scroll lock on unmount or when CSS fullscreen exits
    useEffect(() => {
        return () => {
            // Always restore scroll when component unmounts
            document.body.style.overflow = '';
        };
    }, []);

    // Handle Window Resize (for orientation changes)
    useEffect(() => {
        const handleResize = () => {
            if (isCssFullscreen) {
                setWindowHeight(window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCssFullscreen]);

    // Update body scroll lock + CSS fullscreen height variable
    useEffect(() => {
        if (!isCssFullscreen) {
            document.body.style.overflow = '';
        }
        if (containerRef.current && isCssFullscreen) {
            containerRef.current.style.setProperty('--window-height', `${windowHeight}px`);
        }
    }, [isCssFullscreen, windowHeight]);

    // Update progress bar CSS variable
    useEffect(() => {
        if (progressBarRef.current) {
            const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
            progressBarRef.current.style.setProperty('--progress-percent', `${pct}%`);
        }
    }, [currentTime, duration]);

    // PHASE 2: PROFESSIONAL MEDIA MASTERING (Absolute Consistency)
    // Implements Audio Compression + Video Glow + Denoising
    useEffect(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        const initMastering = () => {
            // Already initialized?
            if (audioContextRef.current) return;

            try {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (!AudioContextClass) throw new Error("AudioContext not supported");

                const ctx = new AudioContextClass();
                audioContextRef.current = ctx;

                // TRY to take control for Professional Mastering
                // This will fail if CORS is restrictive
                const source = ctx.createMediaElementSource(video);
                sourceNodeRef.current = source;

                const compressor = ctx.createDynamicsCompressor();
                // "Broadcast Standard" Mastering Settings
                compressor.threshold.value = -20;
                compressor.knee.value = 40;
                compressor.ratio.value = 12;
                compressor.attack.value = 0.003;
                compressor.release.value = 0.25;
                compressorNodeRef.current = compressor;

                source.connect(compressor);
                compressor.connect(ctx.destination);

                setIsMastered(true);
                console.log("💎 Professional Audio Mastering Active (Broadcast Level)");
            } catch (e) {
                // FALLBACK: If CORS blocks Mastering, use our safe Volume Boost
                console.warn("⚠️ Audio Mastering blocked by CORS. Falling back to Native Volume Normalization.", e);
                video.volume = 0.85; // Reliable boost
                setIsMastered(false);
            }
        };

        const handlePlay = () => {
            initMastering();
            // Resume context if suspended (browser policy)
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        video.addEventListener('play', handlePlay);

        const handleVideoError = () => {
            const error = video.error;
            let errorMessage = "An unknown video error occurred.";

            if (error) {
                switch (error.code) {
                    case 1: errorMessage = "Video loading aborted by user."; break;
                    case 2: errorMessage = "Network error while loading video. Check your connection or R2/Supabase permissions."; break;
                    case 3: errorMessage = "Video decoding failed. The format might be unsupported or the file corrupted."; break;
                    case 4: errorMessage = "Video source not supported or URL is invalid. Check signed URL expiry."; break;
                }
            }

            console.error(`❌ [JuneteenthTube] Video Error: ${errorMessage}`, {
                code: error?.code,
                message: error?.message,
                src: activeSrc,
                readyState: video.readyState,
                networkState: video.networkState
            });

            // Reactive fallback: if primary source fails, try H.264 version
            if ((error?.code === 3 || error?.code === 4) && srcH264 && !triedFallback) {
                console.log('🔄 Trying H.264 fallback:', srcH264);
                setTriedFallback(true);
                setActiveSrc(srcH264);
            } else if (error?.code === 3 || error?.code === 4) {
                setPlaybackError('Video format may not be supported in this browser');
            }
            setIsBuffering(false);
        };

        video.addEventListener('error', handleVideoError);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('error', handleVideoError);
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.warn("Error closing AudioContext:", e));
                audioContextRef.current = null;
            }
        };
    }, [activeSrc, srcH264, triedFallback]);

    // Format time helper
    const formatTime = (time: number) => {
        if (!isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Handle Metadata Load
    const onLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);

            // DETECT VIDEO QUALITY
            const { videoWidth, videoHeight } = videoRef.current;
            // Simple logic: Height or Width checks
            if (videoWidth >= 3840 || videoHeight >= 2160) {
                setQualityBadge("4K");
            } else if (videoWidth >= 1920 || videoHeight >= 1080) {
                setQualityBadge("HD");
            } else {
                setQualityBadge(null); // SD
            }
        }
    };

    // Handle Time Update
    const onTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Handle Video Ended
    const onEnded = () => {
        setIsPlaying(false);
        setHasEnded(true);
        setShowControls(true);
    };

    // Toggle Play/Pause
    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            if (!showControls && !hasEnded) {
                setShowControls(true);
                return;
            }

            if (videoRef.current.paused || hasEnded) {
                videoRef.current.play();
                setIsPlaying(true);
                setHasEnded(false);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    // Handle Seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Toggle Mute
    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // Handle Volume Change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            if (newVolume === 0) {
                setIsMuted(true);
                videoRef.current.muted = true;
            } else if (isMuted) {
                setIsMuted(false);
                videoRef.current.muted = false;
            }
        }
        setVolume(newVolume);
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

    // Handle Casting (Chrome / Safari support)
    const handleCast = async (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!videoRef.current) return;

        const videoElement = videoRef.current as unknown as HTMLVideoElementWithWebKit;

        // 1. Try Safari/iOS AirPlay (webkitShowPlaybackTargetPicker)
        if (videoElement.webkitShowPlaybackTargetPicker) {
            try {
                videoElement.webkitShowPlaybackTargetPicker();
                return;
            } catch (error) {
                console.error("AirPlay failed:", error);
            }
        }

        // 2. Try Chrome/Standard Remote Playback API
        if (videoElement.remote) {
            try {
                if (videoElement.remote.state === 'disconnected') {
                    await videoElement.remote.prompt();
                } else {
                    // If connected, maybe prompt to disconnect? Or just prompt universally.
                    // Standard behavior is prompt() handles the toggle or selection.
                    await videoElement.remote.prompt();
                }
            } catch (error) {
                if (error instanceof Error && (error.name === 'AbortError' || error.name === 'NotAllowedError' || error.message?.includes('dismissed'))) {
                    // User cancelled
                } else {
                    console.error("Cast error:", error);
                    alert(`Casting failed: ${(error instanceof Error ? error.message : "Unknown error")}`);
                }
            }
        } else {
            alert("Casting or AirPlay is not supported on this browser/device.");
        }
    };

    // Toggle Fullscreen - Smart handling for Mobile vs Desktop
    const toggleFullscreen = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!containerRef.current || !videoRef.current) return;

        // Detect iOS specifically (needs CSS workaround)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;

        // iOS: Use CSS Overlay "Pseudo-Fullscreen" to allow force-zoom/cover
        if (isIOS) {
            const willEnter = !isCssFullscreen;
            setIsCssFullscreen(willEnter);
            // Force zoom/cover when entering mobile fullscreen
            if (willEnter) {
                setWindowHeight(window.innerHeight); // Set initial height
                setIsZoomed(true);
                // Lock body scroll
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
            return;
        }

        // Android / Desktop: Standard Fullscreen API
        try {
            if (!document.fullscreenElement && !(document as unknown as { webkitFullscreenElement: Element }).webkitFullscreenElement) {
                // Enter Fullscreen
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen) {
                    await (containerRef.current as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen(); // Safari/Old Chrome
                } else if ((containerRef.current as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen) {
                    await (containerRef.current as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen(); // IE/Edge
                } else {
                    // Fallback to CSS Fullscreen if native fails
                    console.warn("Native fullscreen not supported, falling back to CSS");
                    setIsCssFullscreen(true);
                    setWindowHeight(window.innerHeight);
                    setIsZoomed(true);
                    document.body.style.overflow = 'hidden';
                }
            } else {
                // Exit Fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen) {
                    await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
                } else if ((document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen) {
                    await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
                }
            }
        } catch (err) {
            console.error(`Error attempting to toggle fullscreen: ${err}`);
            // Fallback to CSS Fullscreen if native fails
            setIsCssFullscreen(!isCssFullscreen);
            if (!isCssFullscreen) {
                setWindowHeight(window.innerHeight);
                setIsZoomed(true);
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    };

    // Listen for Fullscreen Changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        };
    }, []);

    // Auto-hide controls
    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 6000);
        }
    };

    // Fix: Separate effect initialization to avoid synchronous setState warning
    useEffect(() => {
        // Only set timeout if playing, don't force showControls(true) here unconditionally
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

        if (isPlaying && !hasEnded) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 6000);
        }
        // We intentionally don't call resetControlsTimeout() here to avoid the state loop
    }, [isPlaying, hasEnded]);

    const handleMouseMove = () => {
        resetControlsTimeout();
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "group relative bg-black overflow-hidden flex flex-col",
                isCssFullscreen ? "fixed inset-0 z-[10000] w-full dynamic-height" : "w-full h-full"
            )}
            onMouseMove={handleMouseMove}
            onClick={resetControlsTimeout}
            onMouseLeave={resetControlsTimeout}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <video
                ref={videoRef}
                src={activeSrc}
                preload="metadata"
                className={cn(
                    "w-full h-full flex-grow pointer-events-none",
                    (isZoomed || isCssFullscreen) ? "object-cover" : "object-contain",
                    hasStartedPlaying && "video-enhanced"
                )}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
                onWaiting={() => setIsBuffering(true)}
                onCanPlayThrough={() => setIsBuffering(false)}
                onPlaying={() => {
                    setIsBuffering(false);
                    setHasStartedPlaying(true);
                }}
                playsInline
                crossOrigin="anonymous"
                disablePictureInPicture={false}
                disableRemotePlayback={false}
            />

            {/* High-Quality Poster Overlay - Only shows before first play or after video ends */}
            {poster && (!hasStartedPlaying || hasEnded) && (
                <div className="absolute inset-0 z-[1] pointer-events-none">
                    <Image
                        src={poster}
                        alt="Video thumbnail"
                        fill
                        priority
                        sizes="100vw"
                        className={cn(
                            "object-contain",
                            isZoomed && "object-cover"
                        )}
                    />
                </div>
            )}

            {/* Buffering Spinner — visible during stalls */}
            {isBuffering && hasStartedPlaying && (
                <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {/* Non-blocking playback error/status banner */}
            {playbackError && (
                <div className="absolute top-4 left-4 right-4 z-[50] flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 flex-1">{playbackError}</span>
                    <button
                        onClick={() => setPlaybackError(null)}
                        className="text-gray-500 hover:text-white transition-colors p-1"
                        aria-label="Dismiss"
                    >
                        <span className="text-xs">✕</span>
                    </button>
                </div>
            )}

            {/* Interaction Layer - Intercepts all clicks to prevent native iOS controls */}
            <div
                className="absolute inset-0 z-0 bg-transparent"
                onClick={togglePlay}
            />

            {/* Big Play/Replay Overlay - REMOVED per user request */}

            {/* Unified Quality & Mastering Badge (Top Right) */}
            {(qualityBadge || isMastered) && hasStartedPlaying && (
                <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    <div className={cn(
                        "px-2.5 py-1 backdrop-blur-md rounded-md text-[11px] font-black tracking-tighter border shadow-2xl flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-700",
                        isMastered
                            ? "bg-white/5 border-white/20 text-white/90"
                            : "bg-black/40 border-white/10 text-white/70"
                    )}>
                        {isMastered && <div className="w-1 h-1 bg-j-gold rounded-full animate-pulse shadow-[0_0_8px_#FFD700]" />}
                        <span className="drop-shadow-sm">
                            {qualityBadge || ""}{isMastered ? "M" : ""}
                        </span>
                    </div>
                </div>
            )}

            {/* SVG Filter for Video Sharpening (Upscaling Standard) */}
            <svg width="0" height="0" className="absolute invisible pointer-events-none overflow-hidden">
                <defs>
                    <filter id="video-sharpen">
                        <feConvolveMatrix
                            order="3"
                            preserveAlpha="true"
                            kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
                        />
                    </filter>
                </defs>
            </svg>

            {/* Controls Bar */}
            <div
                className={`
                    absolute inset-0 z-20
                    bg-transparent
                    transition-opacity duration-300 flex flex-col justify-end
                    ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowControls(false);
                }}
            >
                <div
                    className="
                        w-full 
                        px-[max(1rem,env(safe-area-inset-left))] 
                        pr-[max(1rem,env(safe-area-inset-right))]
                        pb-[max(1rem,env(safe-area-inset-bottom))] 
                        pt-12 
                        bg-gradient-to-t from-black/90 via-black/40 to-transparent
                    "
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Bar */}
                    <div
                        ref={progressBarRef}
                        className="relative group/progress h-2 mb-4 cursor-pointer w-full progress-fill"
                    >
                        {/* Background Track */}
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/30 rounded-full overflow-hidden">
                        </div>

                        {/* Native Range Input for Interaction */}
                        <input
                            type="range"
                            aria-label="Seek video"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="
                            absolute top-[-6px] left-0 w-full h-4 opacity-0 z-20 cursor-pointer
                        "
                        />

                        {/* Visual Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-j-red rounded-full z-10 pointer-events-none w-[var(--progress-percent)]"
                        />

                        {/* Scrubber Knob (Visual only) */}
                        <div
                            className="
                            absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md z-10 pointer-events-none
                            scale-0 group-hover/progress:scale-100 transition-transform left-[var(--progress-percent)]
                        "
                        />
                    </div>

                    {/* Buttons Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="text-white hover:text-j-red transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-manipulation"
                                aria-label={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                            </button>

                            {/* Volume Group */}
                            <div className="flex items-center gap-2 group/volume">
                                <button
                                    onClick={toggleMute}
                                    className="text-white hover:text-white/80 transition-colors focus:outline-none"
                                >
                                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 flex items-center">
                                    <input
                                        type="range"
                                        aria-label="Volume"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>

                            {/* Time Info */}
                            <div className="text-white/80 text-sm font-medium font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(!isZoomed);
                                }}
                                className="text-white hover:text-j-gold transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-manipulation"
                                title={isZoomed ? "Original Aspect" : "Zoom to Fill"}
                            >
                                <Maximize2 className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleCast}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-manipulation"
                                title="Cast to Device"
                            >
                                <Cast className="w-6 h-6" />
                            </button>
                            <button
                                onClick={togglePip}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-manipulation"
                                title="Picture-in-Picture"
                            >
                                <PictureInPicture className="w-6 h-6" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-manipulation"
                            >
                                {isFullscreen || isCssFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
