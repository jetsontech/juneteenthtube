"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";
import { useVideo } from "@/context/VideoContext";
import { VideoProps } from "@/components/video/VideoCard";

// Dynamic import to avoid SSR issues
const CustomPlayer = dynamic(
    () => import("@/components/video/CustomPlayer").then(mod => mod.CustomPlayer),
    { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" /> }
);

export default function WatchPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const { getVideoById, videos } = useVideo();
    const [video, setVideo] = useState<VideoProps | undefined>();

    // Re-run when videos are loaded from database
    useEffect(() => {
        if (resolvedParams.id && videos.length > 0) {
            setVideo(getVideoById(resolvedParams.id));
        }
    }, [resolvedParams.id, videos, getVideoById]);

    // Interaction State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likesCount, setLikesCount] = useState(video?.likes || 0);

    // Comments State
    const [comments, setComments] = useState<{ id: number, user: string, text: string, timestamp: string }[]>([]);
    const [newComment, setNewComment] = useState("");

    const handleComment = () => {
        if (!newComment.trim()) return;

        const comment = {
            id: Date.now(),
            user: "You",
            text: newComment,
            timestamp: "Just now"
        };

        setComments(prev => [comment, ...prev]);
        setNewComment("");
    };

    // Update local state when video loads
    useEffect(() => {
        if (video) {
            setLikesCount(video.likes || 0);
        }
    }, [video]);

    const handleSubscribe = () => {
        setIsSubscribed(!isSubscribed);
    };

    const handleLike = () => {
        if (liked) {
            setLiked(false);
            setLikesCount((prev: number) => prev - 1);
        } else {
            setLiked(true);
            setLikesCount((prev: number) => prev + 1);
            if (disliked) setDisliked(false);
        }
    };

    const handleDislike = () => {
        if (disliked) {
            setDisliked(false);
        } else {
            setDisliked(true);
            if (liked) {
                setLiked(false);
                setLikesCount((prev: number) => prev - 1);
            }
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    };

    if (!video) {
        return <div className="p-8 text-white text-center">Loading video...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto md:pt-4">
            {/* Primary Column - Player & Info */}
            <div className="flex-1 min-w-0">
                {/* Player Container - Edge to Edge on Mobile */}
                <div className="relative aspect-video bg-black shadow-2xl md:rounded-xl md:ring-1 md:ring-white/10 overflow-hidden">
                    {video.videoUrl ? (
                        <CustomPlayer src={video.videoUrl} poster={video.thumbnail} />
                    ) : (
                        /* Mock Player for videos without real URL */
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                                <p className="text-white/50 mb-2">Mock Video ID: {video.id}</p>
                                <p className="text-sm text-gray-500">(No actual video file associated with this mock data)</p>
                                <button className="mt-4 bg-j-red text-white px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">
                                    Simulate Play
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Video Info */}
                <div className="p-4 md:p-0 mt-4">
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Channel */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-j-green flex-shrink-0 overflow-hidden">
                                {video.channelAvatar ? (
                                    <img src={video.channelAvatar} alt={video.channelName} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full bg-j-green" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{video.channelName}</h3>
                                <p className="text-xs text-gray-400">1.2K subscribers</p>
                            </div>
                            <button
                                onClick={handleSubscribe}
                                className={`ml-4 px-4 py-2 rounded-full text-sm font-bold transition-colors ${isSubscribed
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-white text-black hover:bg-gray-200"
                                    }`}
                            >
                                {isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <div className="flex items-center bg-white/10 rounded-full p-1">
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-l-full transition-colors ${liked ? "text-white bg-white/20" : "text-white hover:bg-white/20"
                                        }`}
                                >
                                    <ThumbsUp className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
                                    <span className="text-sm font-bold">{likesCount}</span>
                                </button>
                                <div className="w-px h-6 bg-white/20"></div>
                                <button
                                    onClick={handleDislike}
                                    className={`px-3 py-1.5 rounded-r-full transition-colors ${disliked ? "text-white bg-white/20" : "text-white hover:bg-white/20"
                                        }`}
                                >
                                    <ThumbsDown className={`w-5 h-5 ${disliked ? "fill-current" : ""}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-bold hidden sm:inline">Share</span>
                            </button>

                            <a
                                href={video.videoUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-j-green/20 text-j-green hover:bg-j-green/30 rounded-full transition-colors border border-j-green/50"
                            >
                                <span className="text-sm font-bold">Download</span>
                            </a>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-xl p-4 text-sm mt-4 hover:bg-white/10 transition-colors">
                        <div className="flex gap-2 font-bold mb-2">
                            <span>{video.views} views</span>
                            <span>{video.postedAt}</span>
                        </div>
                        {video.videoUrl ? "Uploaded from your device." : "Experience the vibrant energy of the 2024 Juneteenth Atlanta Parade! Featuring marching bands, dance troupes, and community floats. #Juneteenth #Atlanta #FreedomDay"}

                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6">
                    <h3 className="font-bold mb-4 text-white">Comments ({comments.length})</h3>
                    <div className="flex items-start gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-j-red flex-shrink-0 flex items-center justify-center text-white font-bold">
                            Y
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-transparent border-b border-white/20 pb-2 text-white focus:outline-none focus:border-white transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={handleComment}
                                    disabled={!newComment.trim()}
                                    className="px-4 py-2 bg-white/10 text-white rounded-full text-sm font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Comment
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                                        {comment.user[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-white text-sm">{comment.user}</span>
                                            <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-200 mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary Column - Recommendations */}
            <div className="lg:w-[350px] xl:w-[400px] flex-shrink-0 space-y-4 hidden lg:block">
                <h3 className="font-bold mb-2 text-white">Up Next</h3>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-2 cursor-pointer group">
                        <div className="w-40 aspect-video bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-white/5 animate-pulse" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-j-red transition-colors">Recommended Video {i}</h4>
                            <p className="text-xs text-gray-400 mt-1">Juneteenth Atlanta</p>
                            <p className="text-xs text-gray-500">5K views • 2 days ago</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
