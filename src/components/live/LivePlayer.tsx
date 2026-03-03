"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

interface LivePlayerProps {
    streamUrl: string;
    posterUrl?: string;
    playlist?: string[];
}

export function LivePlayer({ streamUrl, posterUrl, playlist }: LivePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentPlaylistIndex = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLive, setIsLive] = useState(true);
    const [hasError, setHasError] = useState(false);

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

        const onPlay = () => setIsPlaying(true);
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
            <div className="w-full h-full bg-zinc-900/80 flex flex-col items-center justify-center rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
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
            <div className="w-full h-full bg-zinc-900/80 flex flex-col items-center justify-center rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
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
            className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group cursor-pointer"
        >
            {/* Native HTML5 Video */}
            <video
                ref={videoRef}
                poster={posterUrl}
                muted={isMuted}
                playsInline
                autoPlay
                controls
                className="w-full h-full object-contain bg-black"
            />
        </div>
    );
}
