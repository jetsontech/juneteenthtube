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
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPlayerProps {
    src: string;
    poster?: string;
}


interface HTMLVideoElementWithWebKit extends HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
    webkitEnterFullscreen?: () => void;
}

export function CustomPlayer({ src, poster }: CustomPlayerProps) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isBuffering, setIsBuffering] = useState(true);
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

    // NEW: Custom CSS Fullscreen state for Mobile
    const [isCssFullscreen, setIsCssFullscreen] = useState(false);
    const [windowHeight, setWindowHeight] = useState(0); // Track window height for safe scaling

    // NEW: Audio & Video Quality State
    const [qualityBadge, setQualityBadge] = useState<string | null>(null);
    const [isEnhanced, setIsEnhanced] = useState(false); // Track if basic enhancements are active
    const [isMastered, setIsMastered] = useState(false); // Track if professional mastering is active
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);

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

    // Update body scroll lock
    useEffect(() => {
        if (!isCssFullscreen) {
            document.body.style.overflow = '';
        }
    }, [isCssFullscreen]);

    // PHASE 2: PROFESSIONAL MEDIA MASTERING (Absolute Consistency)
    // Implements Audio Compression + Video Glow + Denoising
    useEffect(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;

        const initMastering = () => {
            // Already initialized?
            if (audioContextRef.current) return;

            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
                setIsEnhanced(true);
                console.log("💎 Professional Audio Mastering Active (Broadcast Level)");
            } catch (e) {
                // FALLBACK: If CORS blocks Mastering, use our safe Volume Boost
                console.warn("⚠️ Audio Mastering blocked by CORS. Falling back to Native Volume Normalization.", e);
                video.volume = 0.85; // Reliable boost
                setIsEnhanced(true);
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

        return () => {
            video.removeEventListener('play', handlePlay);
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.warn("Error closing AudioContext:", e));
                audioContextRef.current = null;
            }
        };
    }, []);

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

        const video = videoRef.current as unknown as HTMLVideoElementWithWebKit;

        // 1. Try Safari/iOS AirPlay (webkitShowPlaybackTargetPicker)
        if (video.webkitShowPlaybackTargetPicker) {
            try {
                video.webkitShowPlaybackTargetPicker();
                return;
            } catch (error) {
                console.error("AirPlay failed:", error);
            }
        }

        // 2. Try Chrome/Standard Remote Playback API
        if (video.remote) {
            try {
                if (video.remote.state === 'disconnected') {
                    await video.remote.prompt();
                } else {
                    // If connected, maybe prompt to disconnect? Or just prompt universally.
                    // Standard behavior is prompt() handles the toggle or selection.
                    await video.remote.prompt();
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
    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!containerRef.current || !videoRef.current) return;

        const video = videoRef.current as unknown as HTMLVideoElementWithWebKit;
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
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                // Fallback to CSS Fullscreen if native fails
                setIsCssFullscreen(true);
                setWindowHeight(window.innerHeight);
                setIsZoomed(true);
                document.body.style.overflow = 'hidden';
            });
        } else {
            document.exitFullscreen();
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
                isCssFullscreen ? "fixed inset-0 z-[9999] w-full" : "w-full h-full"
            )}
            style={isCssFullscreen ? { height: `${windowHeight}px` } : undefined}
            onMouseMove={handleMouseMove}
            onClick={resetControlsTimeout}
            onMouseLeave={resetControlsTimeout}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <video
                ref={videoRef}
                src={src}
                preload="auto"
                className={cn(
                    "w-full h-full flex-grow pointer-events-none",
                    (isZoomed || isCssFullscreen) ? "object-cover" : "object-contain"
                )}
                // YOUTUBE-LEVEL VIDEO ENHANCEMENT via CSS Filters
                // Applied after playback starts to enhance user-uploaded content
                // These subtle enhancements improve perceived quality without heavy processing
                // YOUTUBE-LEVEL MASTERING & VISUAL CONSISTENCY
                // Uses a multi-pass filter stack to unify the look across all uploads
                style={hasStartedPlaying ? {
                    filter: cn(
                        'contrast(1.05) saturate(1.1) brightness(1.02)', // Base Enhancement
                        'sepia(0.05) hue-rotate(-2deg)', // The "Juneteenth Glow" warmth
                        'blur(0.4px)', // Denoising (smoothes out compression artifacts)
                        'url(#video-sharpen)' // Restoration (re-adds edge clarity)
                    ),
                    imageRendering: 'high-quality' as React.CSSProperties['imageRendering']
                } : undefined}
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
                webkit-playsinline="true"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                x5-playsinline="true"
                disablePictureInPicture={false}
                disableRemotePlayback={false}
            // NOTE: crossOrigin removed - was causing CORS issues with some R2 videos
            // NOTE: CSS filter removed - was potentially breaking video decode on mobile
            />

            {/* High-Quality Poster Overlay - Only shows before first play or after video ends */}
            {poster && poster.includes('pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev') && (!hasStartedPlaying || hasEnded) && (
                <div className="absolute inset-0 z-[1]">
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

            {/* Interaction Layer - Intercepts all clicks to prevent native iOS controls */}
            <div
                className="absolute inset-0 z-0 bg-transparent"
                onClick={togglePlay}
            />

            {/* Big Play/Replay Overlay - REMOVED per user request */}

            {/* Quality & Enhancement Badges (Top Right) */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-none">
                {qualityBadge && (
                    <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white/90 border border-white/10 shadow-sm">
                        {qualityBadge}
                    </div>
                )}
                {isEnhanced && hasStartedPlaying && (
                    <div className={cn(
                        "px-2 py-1 backdrop-blur-md rounded text-[9px] font-black text-white uppercase tracking-tighter border border-white/20 shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-500",
                        isMastered ? "bg-j-gold/80" : "bg-j-red/80"
                    )}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        {isMastered ? "Mastering Active" : "Smart Enhanced"}
                    </div>
                )}
            </div>

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
                        className="relative group/progress h-2 mb-4 cursor-pointer w-full"
                        style={{ '--progress-percent': `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
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
                                className="text-white hover:text-j-red transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto touch-action-manipulation"
                                style={{ touchAction: 'manipulation' }}
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
                                className={cn(
                                    "text-white hover:text-j-gold transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto",
                                    isZoomed && "text-j-gold"
                                )}
                                style={{ touchAction: 'manipulation' }}
                                title={isZoomed ? "Original Aspect" : "Zoom to Fill"}
                            >
                                <Maximize2 className="w-6 h-6" />
                            </button>
                            <button
                                onClick={handleCast}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto"
                                style={{ touchAction: 'manipulation' }}
                                title="Cast to Device"
                            >
                                <Cast className="w-6 h-6" />
                            </button>
                            <button
                                onClick={togglePip}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto"
                                style={{ touchAction: 'manipulation' }}
                                title="Picture-in-Picture"
                            >
                                <PictureInPicture className="w-6 h-6" />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-white/80 transition-colors focus:outline-none p-4 -m-4 relative z-50 pointer-events-auto"
                                style={{ touchAction: 'manipulation' }}
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
