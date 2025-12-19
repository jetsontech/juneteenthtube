"use client";

import { useEffect, useRef, useState } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    RotateCcw,
    PictureInPicture,
    Cast,
    Maximize2,
    Crop
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPlayerProps {
    src: string;
    poster?: string;
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
    const [isZoomed, setIsZoomed] = useState(true); // Default to zoomed/fill to remove black bars

    // User Interaction State
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Force playsinline for iOS (React sometimes is tricky with this)
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.setAttribute("webkit-playsinline", "true");
        }
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

        const video = videoRef.current as any;

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
        if (video.remote && video.remote.state !== 'disabled') {
            try {
                await video.remote.prompt();
            } catch (error: any) {
                if (error.name === 'AbortError' || error.name === 'NotAllowedError' || error.message?.includes('dismissed')) {
                    // User cancelled
                } else {
                    console.error("Cast error:", error);
                    alert(`Casting failed: ${error.message || "Unknown error"}`);
                }
            }
        } else {
            alert("Casting or AirPlay is not supported on this browser/device.");
        }
    };

    // Toggle Fullscreen
    const toggleFullscreen = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
                // Fallback for iOS video element fullscreen if container fails (safari on iPhone often requires video element)
                // But generally for Custom Controls on iOS, we want to stay inline OR use the container.
                if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
                    (videoRef.current as any).webkitEnterFullscreen();
                }
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
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange); // Safari

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
            }, 3000);
        }
    };

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [isPlaying, hasEnded]);

    const handleMouseMove = () => {
        resetControlsTimeout();
    };

    return (
        <div
            ref={containerRef}
            className="group relative w-full h-full bg-black overflow-hidden flex flex-col"
            onMouseMove={handleMouseMove}
            onClick={resetControlsTimeout}
            onMouseLeave={resetControlsTimeout} // Extend timeout instead of hiding immediately
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className={cn(
                    "w-full h-full flex-grow pointer-events-none transition-all duration-300",
                    isZoomed ? "object-cover" : "object-contain"
                )}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={onEnded}
                playsInline
                webkit-playsinline="true"
                // @ts-ignore
                x5-playsinline="true"
                disablePictureInPicture={false}
                disableRemotePlayback={false} // Explicitly allow casting
            />

            {/* Interaction Layer - Intercepts all clicks to prevent native iOS controls */}
            <div
                className="absolute inset-0 z-0 bg-transparent"
                onClick={togglePlay}
            />

            {/* Big Play/Replay Overlay - HIDDEN ON MOBILE */}
            {(!isPlaying || hasEnded) && (
                <div
                    className="absolute inset-0 hidden sm:flex items-center justify-center bg-black/30 cursor-pointer z-10"
                    onClick={togglePlay}
                >
                    <div className="p-6 bg-j-red/90 rounded-full shadow-2xl hover:scale-110 transition-transform backdrop-blur-sm group/btn">
                        {hasEnded ? (
                            <RotateCcw className="w-12 h-12 text-white ml-1 group-hover/btn:rotate-[-45deg] transition-transform" />
                        ) : (
                            <Play className="w-12 h-12 text-white ml-1" />
                        )}
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div
                className={`
                    absolute bottom-0 left-0 right-0 z-20
                    bg-gradient-to-t from-black/90 via-black/60 to-transparent
                    px-4 pb-4 pt-12
                    transition-opacity duration-300
                    ${showControls ? 'opacity-100 visible' : 'opacity-0 invisible'}
                `}
            >
                {/* Progress Bar */}
                <div className="relative group/progress h-2 mb-4 cursor-pointer w-full">
                    {/* Background Track */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/30 rounded-full overflow-hidden">
                        {/* Buffered/Progress fill would go here */}
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
                        className="absolute top-0 left-0 h-full bg-j-red rounded-full z-10 pointer-events-none"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />

                    {/* Scrubber Knob (Visual only) */}
                    <div
                        className="
                            absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md z-10 pointer-events-none
                            scale-0 group-hover/progress:scale-100 transition-transform
                        "
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="text-white hover:text-j-red transition-colors focus:outline-none"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
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
                                "text-white hover:text-j-gold transition-colors focus:outline-none",
                                isZoomed && "text-j-gold"
                            )}
                            title={isZoomed ? "Original Aspect" : "Zoom to Fill"}
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleCast}
                            className="text-white hover:text-white/80 transition-colors focus:outline-none z-50 relative pointer-events-auto"
                            title="Cast to Device"
                        >
                            <Cast className="w-5 h-5" />
                        </button>
                        <button
                            onClick={togglePip}
                            className="text-white hover:text-white/80 transition-colors focus:outline-none"
                            title="Picture-in-Picture"
                        >
                            <PictureInPicture className="w-5 h-5" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-white/80 transition-colors focus:outline-none"
                        >
                            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
