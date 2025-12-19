"use client";

import { use, useEffect, useState } from "react";
import { useVideo } from "@/context/VideoContext";
import { VideoProps } from "@/components/video/VideoCard";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical, X, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ShortsPlayerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { getVideoById, videos, getLikes, toggleLike } = useVideo();
    const [video, setVideo] = useState<VideoProps | undefined>();
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // Parse duration to seconds for filtering shorts
    const parseDurationToSeconds = (duration: string | undefined): number => {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    // Get all shorts (videos <= 60 seconds)
    const shorts = videos.filter(v => {
        const dur = parseDurationToSeconds(v.duration);
        return dur > 0 && dur <= 60;
    });

    // Current short index
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
    }, [resolvedParams.id]);

    const handleLike = async () => {
        if (!video) return;
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
        if (disliked) setDisliked(false);
        try {
            await toggleLike(video.id, 'like');
        } catch (e) {
            setLiked(wasLiked);
        }
    };

    const handleDislike = async () => {
        if (!video) return;
        const wasDisliked = disliked;
        setDisliked(!wasDisliked);
        if (liked) {
            setLiked(false);
            setLikesCount(prev => prev - 1);
        }
        try {
            await toggleLike(video.id, 'dislike');
        } catch (e) {
            setDisliked(wasDisliked);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            router.push(`/shorts/${shorts[currentIndex - 1].id}`);
        }
    };

    const goToNext = () => {
        if (currentIndex < shorts.length - 1) {
            router.push(`/shorts/${shorts[currentIndex + 1].id}`);
        }
    };

    if (!video) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading short...</div>;
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            {/* Close button */}
            <Link href="/" className="absolute top-4 left-4 z-50 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6 text-white" />
            </Link>

            {/* Navigation arrows - desktop */}
            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-4 z-50">
                <button
                    onClick={goToPrevious}
                    disabled={currentIndex <= 0}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronUp className="w-6 h-6 text-white" />
                </button>
                <button
                    onClick={goToNext}
                    disabled={currentIndex >= shorts.length - 1}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronDown className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Main container - vertical video */}
            <div className="relative h-full w-full max-w-[420px] max-h-[90vh] md:max-h-[85vh] flex">
                {/* Video container */}
                <div className="relative flex-1 bg-black rounded-xl overflow-hidden">
                    {video.videoUrl ? (
                        <video
                            src={video.videoUrl}
                            className="w-full h-full object-contain"
                            autoPlay
                            muted
                            loop
                            playsInline
                            // @ts-ignore
                            webkitPlaysInline={true}
                            controls={false}
                            onClick={(e) => {
                                const vid = e.currentTarget;
                                if (vid.paused) vid.play();
                                else vid.pause();
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Bottom info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                {video.channelAvatar ? (
                                    <img src={video.channelAvatar} alt={video.channelName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-yellow-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm">@{video.channelName}</p>
                            </div>
                            <button className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-white text-sm line-clamp-2">{video.title}</p>
                    </div>
                </div>

                {/* Right side actions */}
                <div className="absolute right-2 bottom-24 flex flex-col gap-4 items-center md:relative md:right-0 md:bottom-0 md:ml-4 md:self-end md:mb-20">
                    <button
                        onClick={handleLike}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ${liked ? 'bg-white/20' : ''}`}>
                            <ThumbsUp className={`w-6 h-6 text-white ${liked ? 'fill-white' : ''}`} />
                        </div>
                        <span className="text-white text-xs font-medium">{likesCount}</span>
                    </button>

                    <button
                        onClick={handleDislike}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors ${disliked ? 'bg-white/20' : ''}`}>
                            <ThumbsDown className={`w-6 h-6 text-white ${disliked ? 'fill-white' : ''}`} />
                        </div>
                        <span className="text-white text-xs font-medium">Dislike</span>
                    </button>

                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">0</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Share2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-xs font-medium">Share</span>
                    </button>

                    <button className="flex flex-col items-center gap-1">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <MoreVertical className="w-6 h-6 text-white" />
                        </div>
                    </button>

                    {/* Channel avatar as sound/music indicator like YouTube */}
                    <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border-2 border-white/30 mt-2 animate-spin-slow">
                        {video.channelAvatar ? (
                            <img src={video.channelAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-red-500 to-green-500" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
