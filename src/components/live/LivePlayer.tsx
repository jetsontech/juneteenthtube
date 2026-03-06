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
    MessageCircle
} from "lucide-react";

interface LivePlayerProps {
    streamUrl: string;
    posterUrl?: string;
    playlist?: string[];
    channelName?: string;
    channelLogo?: string;
    onNext?: () => void;
    onPrev?: () => void;
    onToggleChat?: () => void;
}

export function LivePlayer({
    streamUrl,
    posterUrl,
    playlist,
    channelName,
    channelLogo,
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
    const [showChannelInfo, setShowChannelInfo] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [hasError, setHasError] = useState(false);

    // ── Channel Info Overlay Logic ────────────────────────────
    useEffect(() => {
        if (channelName) {
            setShowChannelInfo(true);
            if (infoTimerRef.current) clearTimeout(infoTimerRef.current);
            infoTimerRef.current = setTimeout(() => setShowChannelInfo(false), 4000);
        }
    }, [channelName, streamUrl]);

    // ── Keyboard Navigation ───────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if in fullscreen or if the video container has focus
            if (!document.fullscreenElement && document.activeElement !== containerRef.current) return;

            if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                e.preventDefault();
                onNext?.();
            } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                e.preventDefault();
                onPrev?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onNext, onPrev]);

    // ── Attach HLS or native source ──────────────────────────
    const attachSource = useCallback((url: string) => {
        const video = videoRef.current;
        if (!video || !url) return;

        setHasError(false);

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (url.includes(".m3u8")) {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => { });
                });
                let retryCount = 0;
                const MAX_RETRIES = 3;
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        console.warn("HLS error (attempt " + (retryCount + 1) + "):", data.type, data.details);
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCount < MAX_RETRIES) {
                            retryCount++;
                            setTimeout(() => hls.startLoad(), 2000);
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && retryCount < MAX_RETRIES) {
                            retryCount++;
                            hls.recoverMediaError();
                        } else {
                            setHasError(true);
                        }
                    }
                });
                hlsRef.current = hls;
                setIsLive(true);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                // Safari native HLS
                video.src = url;
                video.play().catch(() => { });
                setIsLive(true);
            }
        } else {
            // Direct MP4 or other format
            video.src = url;
            video.play().catch(() => { });
            setIsLive(false);
        }
    }, []);

    // ── Initialize player ────────────────────────────────────
    useEffect(() => {
        if (streamUrl) {
            attachSource(streamUrl);
        }
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [streamUrl, attachSource]);

    // ── Video event listeners ────────────────────────────────
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => {
            setIsPlaying(true);
            setHasStartedPlaying(true);
        };
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

    // ── Fullscreen listener ──────────────────────────────────
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    // ── Auto-hide controls ───────────────────────────────────
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (isPlaying) {
            hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // ── Control handlers ─────────────────────────────────────
    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => { });
        else v.pause();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        if (v.muted) {
            v.muted = false;
            v.volume = volume;
            setIsMuted(false);
        } else {
            v.muted = true;
            setIsMuted(true);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen();
    };

    // ── Fallback: Broadcast Offline ──────────────────────────
    if (!streamUrl) {
        return (
            <div className="w-full h-full bg-zinc-900/80 flex flex-col items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Broadcast Offline</p>
                <p className="text-white/30 text-xs mt-2">This channel is currently not transmitting.</p>
            </div>
        );
    }

    // ── Error state ──────────────────────────────────────────
    if (hasError) {
        return (
            <div className="w-full h-full bg-zinc-900/80 flex flex-col items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-white/50 text-sm font-bold uppercase tracking-widest">Stream Unavailable</p>
                <p className="text-white/30 text-xs mt-2">Unable to load this stream. Try another channel.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onMouseMove={resetHideTimer}
            onClick={togglePlay}
            className="relative w-full h-full bg-black overflow-hidden shadow-2xl ring-1 ring-white/10 group cursor-pointer outline-none"
        >
            {/* Native HTML5 Video */}
            <video
                ref={videoRef}
                poster={posterUrl}
                muted={isMuted}
                playsInline
                autoPlay
                className="w-full h-full object-contain bg-black pointer-events-none"
            />

            {/* ── Channel Info Overlay ───────────────────────── */}
            <div className={`absolute top-6 left-6 z-50 transition-all duration-500 transform ${showChannelInfo ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
                <div className="flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-3 pr-6 rounded-2xl shadow-2xl">
                    <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                        {channelLogo ? (
                            <img src={channelLogo} alt={channelName} className="w-full h-full object-contain p-2" />
                        ) : (
                            <Tv className="w-6 h-6 text-white/20" />
                        )}
                    </div>
                    <div>
                        <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] mb-0.5">Now Playing</div>
                        <div className="text-white text-lg font-bold tracking-tight leading-tight">{channelName}</div>
                    </div>
                </div>
            </div>

            {/* ── Quick Channel Switch Overlays (Right Side) ──── */}
            <div className={`absolute right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/btn"
                    title="Channel Up"
                >
                    <ChevronUp className="w-6 h-6 text-white/50 group-hover/btn:text-white transition-colors" />
                </button>
                <div className="h-px w-6 bg-white/10 mx-auto" />
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 group/btn"
                    title="Channel Down"
                >
                    <ChevronDown className="w-6 h-6 text-white/50 group-hover/btn:text-white transition-colors" />
                </button>
            </div>

            {/* ── Custom Control Bar ─────────────────────────── */}
            <div className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-20 pb-6 px-8 flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleChat?.(); }}
                            className="text-white/70 hover:text-white transition-colors"
                            title="Open Chat"
                        >
                            <MessageCircle className="w-7 h-7" />
                        </button>

                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                            </button>
                            <input
                                type="range"
                                aria-label="Volume"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                onClick={(e) => e.stopPropagation()}
                                className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Live
                        </div>
                        <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                            {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Interaction Layer for Mobile ───────────────── */}
            <div className={`absolute inset-0 z-10 transition-colors duration-300 ${!isPlaying && hasStartedPlaying ? 'bg-black/20' : ''}`} />
        </div>
    );
}
