"use client";

import { use, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useVideo } from "@/context/VideoContext";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, ChevronUp, ChevronDown, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Hls from "hls.js";

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
    const { getVideoById, videos, getLikes, toggleLike, incrementView } = useVideo();
    const lastIncrementedVideoId = useRef<string | null>(null);

    const video = useMemo(() => {
        if (!resolvedParams.id || videos.length === 0) return undefined;
        return getVideoById(resolvedParams.id);
    }, [resolvedParams.id, videos, getVideoById]);

    const [prevVideoId, setPrevVideoId] = useState<string | null>(null);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showUnmuteHint, setShowUnmuteHint] = useState(true);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const [playbackError, setPlaybackError] = useState<string | null>(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;
    const isSharingRef = useRef(false);

    if (resolvedParams.id !== prevVideoId) {
        setPrevVideoId(resolvedParams.id);
        setIsMuted(true);
        setShowUnmuteHint(true);
        setPlaybackError(null);
    }

    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const handleUnmute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = false;
        }
        setIsMuted(false);
        setShowUnmuteHint(false);
    }, []);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            handleUnmute();
        } else {
            if (videoRef.current) videoRef.current.muted = true;
            setIsMuted(true);
        }
    }, [isMuted, handleUnmute]);

    // Initialize native HTML5 video player
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !video?.videoUrl) return;

        const src = video.videoUrlH264 || video.videoUrl;

        // Clean up previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        retryCountRef.current = 0;
        setPlaybackError(null);

        const handlePlay = () => {
            if (video && lastIncrementedVideoId.current !== video.id) {
                lastIncrementedVideoId.current = video.id;
                incrementView(video.id);
            }
        };
        videoEl.addEventListener('play', handlePlay);

        if (src.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
                hls.loadSource(src);
                hls.attachMedia(videoEl);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoEl.play().catch(() => {});
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
                                setPlaybackError("Playback error — tap to Retry.");
                                break;
                        }
                    }
                });
                hlsRef.current = hls;
            } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
                videoEl.src = src;
                videoEl.play().catch(() => {});
            }
        } else {
            videoEl.src = src;
            videoEl.play().catch(() => {});
        }

        return () => {
            videoEl.removeEventListener('play', handlePlay);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [video, incrementView]);

    const handleRetry = useCallback(() => {
        setPlaybackError(null);
        retryCountRef.current = 0;
        const videoEl = videoRef.current;
        if (!videoEl || !video?.videoUrl) return;

        const src = video.videoUrlH264 || video.videoUrl;
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (src.includes('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
                hls.loadSource(src);
                hls.attachMedia(videoEl);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoEl.play().catch(() => {});
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
                                setPlaybackError("Playback error — tap to Retry.");
                                break;
                        }
                    }
                });
                hlsRef.current = hls;
            } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
                videoEl.src = src;
                videoEl.play().catch(() => {});
            }
        } else {
            videoEl.src = src;
            videoEl.play().catch(() => {});
        }
    }, [video]);

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
        if (!resolvedParams.id) return;
        getLikes(resolvedParams.id).then(({ likes, userStatus }) => {
            setLikesCount(likes);
            setLiked(userStatus === 'like');
            setDisliked(userStatus === 'dislike');
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
        if (!video || isSharingRef.current) return;
        isSharingRef.current = true;

        const shareData = {
            title: video.title,
            text: `Watch "${video.title}" on CultureQuest`,
            url: window.location.href
        };

        // 1. Immediately copy to clipboard in parallel while user gesture is fresh (NO await!)
        let copiedSuccessfully = false;
        try {
            navigator.clipboard.writeText(window.location.href)
                .then(() => { copiedSuccessfully = true; })
                .catch(() => {});
        } catch {
            // Fallback to legacy document.execCommand('copy') synchronous trick
            try {
                const textArea = document.createElement("textarea");
                textArea.value = window.location.href;
                textArea.style.position = "fixed";  // Avoid scrolling to bottom
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand("copy");
                document.body.removeChild(textArea);
                if (successful) copiedSuccessfully = true;
            } catch (fallbackErr) {
                console.warn("Legacy copy failed:", fallbackErr);
            }
        }

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setToastMessage("Shared successfully!");
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setToastMessage("Link copied to clipboard!");
            }
        } catch (err) {
            const errObj = err && typeof err === 'object' ? (err as Record<string, unknown>) : null;
            const errorName = errObj && typeof errObj.name === 'string' ? errObj.name : '';
            const errorMessage = errObj && typeof errObj.message === 'string' ? errObj.message : '';
            const isAbort = errorName === 'AbortError' || errorMessage.includes('AbortError') || errorMessage.includes('Share canceled') || errorMessage.includes('aborted');
            const isAlreadySharing = errorName === 'InvalidStateError' || errorMessage.includes('InvalidStateError') || errorMessage.includes('not yet completed');
            
            if (!isAbort && !isAlreadySharing) {
                console.warn("Share failed:", err);
                if (copiedSuccessfully) {
                    setToastMessage("Link copied to clipboard!");
                } else {
                    setToastMessage("Failed to copy link. Copy URL manually!");
                }
            }
        } finally {
            // Keep the lock active for 1000ms to allow mobile OS transitions to finish
            setTimeout(() => {
                isSharingRef.current = false;
            }, 1000);
        }
    };

    const goToPrevious = () => {
        const prevShort = shorts.at(currentIndex - 1);
        if (currentIndex > 0 && prevShort) router.push(`/shorts/${prevShort.id}?mode=${mode}`);
    };

    const goToNext = () => {
        const nextShort = shorts.at(currentIndex + 1);
        if (currentIndex < shorts.length - 1 && nextShort) router.push(`/shorts/${nextShort.id}?mode=${mode}`);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const diffY = touchStart.y - e.changedTouches[0].clientY;
        if (Math.abs(diffY) > 50) {
            if (diffY > 0) goToNext();
            else goToPrevious();
        }
        setTouchStart(null);
    };

    if (!video) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white font-black tracking-widest uppercase">{"Loading Short..."}</div>;
    }

    return (
        <div
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center overscroll-none touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <Link href="/" aria-label="Back to home" title="Back to home" className="absolute top-4 left-4 z-[60] p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md">
                <ArrowLeft className="w-6 h-6 text-white" />
            </Link>

            {/* Desktop nav arrows */}
            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
                <button onClick={goToPrevious} disabled={currentIndex <= 0} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-xl disabled:opacity-20" title="Previous">
                    <ChevronUp className="w-6 h-6 text-white" />
                </button>
                <button onClick={goToNext} disabled={currentIndex >= shorts.length - 1} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-xl disabled:opacity-20" title="Next">
                    <ChevronDown className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className={cn(
                "fixed inset-0 z-50 bg-black flex items-center justify-center md:relative md:inset-auto md:z-auto md:bg-transparent md:h-full",
                isLandscape ? 'md:max-w-[90vw] md:max-h-[90vh] md:aspect-video' : 'md:max-w-[400px] md:max-h-[90vh] md:aspect-[9/16]'
            )}>
                <div className="relative w-full h-full bg-black md:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                    <div className="w-full h-full absolute inset-0">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            autoPlay
                            muted
                            loop
                            preload="auto"
                            onError={() => {
                                const currentSrc = videoRef.current?.src || "";
                                let nextSrc = currentSrc;
                                
                                if (currentSrc.includes('media.juneteenthtube.com')) {
                                    nextSrc = currentSrc.replace('media.juneteenthtube.com', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                                }

                                if (retryCountRef.current < MAX_RETRIES) {
                                    retryCountRef.current++;
                                    const delay = retryCountRef.current * 1500;
                                    setTimeout(() => {
                                        if (videoRef.current) {
                                            videoRef.current.src = nextSrc;
                                            videoRef.current.load();
                                            videoRef.current.play().catch(() => {});
                                        }
                                    }, delay);
                                } else {
                                    setPlaybackError("Playback error — tap to Retry.");
                                }
                            }}
                        />
                    </div>

                    {playbackError && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[45] flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-red-500 mb-2 font-bold uppercase tracking-wider">{"Playback Error"}</span>
                            <p className="text-white/60 text-xs mb-4 max-w-[250px]">{playbackError}</p>
                            <button onClick={handleRetry} className="px-5 py-2.5 bg-j-gold hover:bg-j-gold/80 text-black text-xs font-black uppercase tracking-widest rounded-full transition-all">
                                {"Retry"}
                            </button>
                        </div>
                    )}

                    {/* Tap to unmute overlay */}
                    {showUnmuteHint && (
                        <button
                            onClick={handleUnmute}
                            className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-xs font-bold px-3 py-2 rounded-full backdrop-blur-sm transition-all animate-pulse"
                        >
                            <VolumeX className="w-4 h-4" />
                            {"Tap to unmute"}
                        </button>
                    )}

                    {/* Video info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                        <div className="flex items-center gap-3 mb-4 pointer-events-auto">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden relative border-2 border-j-gold/30">
                                {video.channelAvatar ? (
                                    <Image src={video.channelAvatar} alt="" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-j-red to-j-gold" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm tracking-tight">@{video.channelName}</p>
                            </div>
                            <button className="px-5 py-2 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-j-gold transition-colors">
                                {"Subscribe"}
                            </button>
                        </div>
                        <p className="text-white/90 text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
                    </div>
                </div>

                {/* Side actions */}
                <div className="absolute right-3 bottom-20 flex flex-col gap-3.5 sm:gap-4 md:gap-5 items-center md:relative md:right-0 md:bottom-0 md:ml-6 md:self-end md:mb-20">
                    <button onClick={handleLike} className="flex flex-col items-center gap-1.5 group">
                        <div className={cn("w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl", liked ? "bg-j-red text-white scale-110" : "bg-white/10 text-white hover:bg-white/20")}>
                            <ThumbsUp className={cn("w-5 h-5 md:w-6 md:h-6", liked && "fill-white")} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{likesCount}</span>
                    </button>

                    <button onClick={handleDislike} className="flex flex-col items-center gap-1.5 group">
                        <div className={cn("w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl", disliked ? "bg-white text-black scale-110" : "bg-white/10 text-white hover:bg-white/20")}>
                            <ThumbsDown className={cn("w-5 h-5 md:w-6 md:h-6", disliked && "fill-white")} />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{"Dislike"}</span>
                    </button>

                    <button className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl">
                            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">0</span>
                    </button>

                    <button onClick={handleShare} className="flex flex-col items-center gap-1.5 group">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl">
                            <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{"Share"}</span>
                    </button>

                    {/* Mute/Unmute button */}
                    <button onClick={toggleMute} className="flex flex-col items-center gap-1.5">
                        <div className={cn("w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-xl", isMuted ? "bg-white/20 text-white" : "bg-j-gold text-black")}>
                            {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-tighter">{isMuted ? 'Muted' : 'Sound'}</span>
                    </button>

                    <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gray-800 overflow-hidden border-2 border-white/20 mt-2 md:mt-4 animate-spin-slow relative shadow-lg">
                        {video.channelAvatar ? (
                            <Image src={video.channelAvatar} alt="" fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-j-green via-j-gold to-j-red" />
                        )}
                    </div>
                </div>
            </div>

            {/* Elegant Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-zinc-950/90 text-white border border-white/10 px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-2xl animate-fade-in flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-j-gold rounded-full animate-ping" />
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
