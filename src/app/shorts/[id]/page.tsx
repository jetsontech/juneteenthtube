"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useVideo } from "@/context/VideoContext";
import { VideoProps } from "@/components/video/VideoCard";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, X, ChevronUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ShortsPlayerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'portrait';
    const isLandscape = mode === 'landscape';
    const { getVideoById, videos, getLikes, toggleLike } = useVideo();

    const [video, setVideo] = useState<VideoProps | undefined>();
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<Player | null>(null);

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);

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
        if (!videoRef.current || !video?.videoUrl) return;

        const player = videojs(videoRef.current, {
            controls: false,
            autoplay: true,
            muted: isMuted,
            loop: true,
            preload: "auto",
            playsinline: true,
            sources: [{
                src: video.videoUrl,
                type: video.videoUrl.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
            }],
            html5: {
                vhs: { overrideNative: true },
                nativeAudioTracks: false,
                nativeVideoTracks: false
            }
        });

        playerRef.current = player;

        player.on('play', () => {
            if (!audioContextRef.current) setupAudioContext();
        });

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [video?.videoUrl, setupAudioContext, isMuted]);

    // Parse duration to seconds for filtering shorts
    const parseDurationToSeconds = (duration: string | undefined): number => {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const shorts = videos.filter(v => {
        const dur = parseDurationToSeconds(v.duration);
        return dur > 0 && dur <= 60;
    });

    const currentIndex = shorts.findIndex(s => s.id === resolvedParams.id);

    useEffect(() => {
        if (resolvedParams.id && videos.length > 0) {
            setVideo(getVideoById(resolvedParams.id));
        }
    }, [resolvedParams.id, videos, getVideoById]);

    useEffect(() => {
        if (!resolvedParams.id) return;
        getLikes(resolvedParams.id).then(({ likes, userStatus }) => {
            setLikesCount(likes);
            if (userStatus === 'like') setLiked(true);
            else if (userStatus === 'dislike') setDisliked(true);
        });
    }, [resolvedParams.id, getLikes]);

    const handleLike = async () => {
        if (!video) return;
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
        if (disliked) setDisliked(false);
        try { await toggleLike(video.id, 'like'); } catch { setLiked(wasLiked); }
    };

    const handleDislike = async () => {
        if (!video) return;
        const wasDisliked = disliked;
        setDisliked(!wasDisliked);
        if (liked) { setLiked(false); setLikesCount(prev => prev - 1); }
        try { await toggleLike(video.id, 'dislike'); } catch { setDisliked(wasDisliked); }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        } catch (err) { console.error("Failed to copy", err); }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            router.push(`/shorts/${shorts[currentIndex - 1].id}?mode=${mode}`);
        }
    };

    const goToNext = () => {
        if (currentIndex < shorts.length - 1) {
            router.push(`/shorts/${shorts[currentIndex + 1].id}?mode=${mode}`);
        }
    };

    if (!video) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white font-black tracking-widest uppercase">Loading Short...</div>;
    }

    return (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
            <Link href="/" className="absolute top-4 left-4 z-50 p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md">
                <X className="w-6 h-6 text-white" />
            </Link>

            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
                <button onClick={goToPrevious} disabled={currentIndex <= 0} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-xl disabled:opacity-20" title="Previous Short">
                    <ChevronUp className="w-6 h-6 text-white" />
                </button>
                <button onClick={goToNext} disabled={currentIndex >= shorts.length - 1} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-xl disabled:opacity-20" title="Next Short">
                    <ChevronDown className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className={cn(
                "fixed inset-0 z-50 bg-black flex items-center justify-center md:relative md:inset-auto md:z-auto md:bg-transparent md:h-full transition-all duration-700",
                isLandscape ? 'md:max-w-[90vw] md:max-h-[90vh] md:aspect-video' : 'md:max-w-[400px] md:max-h-[90vh] md:aspect-[9/16]'
            )}>
                <div className="relative w-full h-full bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                    <div data-vjs-player className="w-full h-full absolute inset-0">
                        <video
                            ref={videoRef}
                            className="video-js vjs-default-skin vjs-shorts-mode w-full h-full"
                            playsInline
                        />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                        <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden relative border-2 border-j-gold/30">
                                {video.channelAvatar ? (
                                    <Image src={video.channelAvatar} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-j-red to-j-gold" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm tracking-tight">@{video.channelName}</p>
                            </div>
                            <button className="px-5 py-2 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-j-gold transition-colors">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-white/90 text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
                    </div>
                </div>

                <div className="absolute right-3 bottom-24 flex flex-col gap-5 items-center md:relative md:right-0 md:bottom-0 md:ml-6 md:self-end md:mb-20">
                    <button onClick={handleLike} className="flex flex-col items-center gap-1.5 group">
                        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl", liked ? "bg-j-red text-white scale-110" : "bg-white/10 text-white hover:bg-white/20")}>
                            <ThumbsUp className={cn("w-6 h-6", liked && "fill-white")} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{likesCount}</span>
                    </button>

                    <button onClick={handleDislike} className="flex flex-col items-center gap-1.5 group">
                        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl", disliked ? "bg-white text-black scale-110" : "bg-white/10 text-white hover:bg-white/20")}>
                            <ThumbsDown className={cn("w-6 h-6", disliked && "fill-white")} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">Dislike</span>
                    </button>

                    <button className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl leading-none">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">0</span>
                    </button>

                    <button onClick={handleShare} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">Share</span>
                    </button>

                    <button
                        onClick={() => {
                            if (!audioContextRef.current) setupAudioContext();
                            if (playerRef.current) {
                                const newMuted = !isMuted;
                                playerRef.current.muted(newMuted);
                                setIsMuted(newMuted);
                            }
                        }}
                        className="flex flex-col items-center gap-1.5"
                    >
                        <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl">
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{isMuted ? 'Muted' : 'Sound'}</span>
                    </button>

                    <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden border-2 border-white/20 mt-4 animate-spin-slow relative shadow-lg">
                        {video.channelAvatar ? (
                            <Image src={video.channelAvatar} alt="" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-j-green via-j-gold to-j-red" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
