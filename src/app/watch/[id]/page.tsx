"use client";

import { use, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";
import { useVideo } from "@/context/VideoContext";

interface Comment {
    id: number | string;
    user: string;
    text: string;
    timestamp: string;
    user_name?: string;
    content?: string;
    created_at?: string;
}

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
    const { getVideoById, videos, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription } = useVideo();
    // Derived State (No side effects)
    const video = useMemo(() => {
        if (!resolvedParams.id || videos.length === 0) return undefined;
        return getVideoById(resolvedParams.id);
    }, [resolvedParams.id, videos, getVideoById]);

    // Interaction State
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // Comments State
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    // Fetch Engagement Data
    useEffect(() => {
        if (!resolvedParams.id) return;

        // Load Comments
        getVideoComments(resolvedParams.id).then((data) => setComments(data as Comment[]));

        // Load Likes
        getLikes(resolvedParams.id).then(({ likes, userStatus }) => {
            setLikesCount(likes);
            if (userStatus === 'like') setLiked(true);
            else if (userStatus === 'dislike') setDisliked(true);
        });

        // Load Subs (Mock Channel Name for now based on video)
        if (video?.channelName) {
            getSubscription(video.channelName).then(setIsSubscribed);
        }

    }, [resolvedParams.id, video?.channelName, getVideoComments, getLikes, getSubscription]);

    const handleComment = async () => {
        if (!newComment.trim() || !video) return;
        try {
            const added = await postComment(video.id, newComment, "You") as { comment: Comment };
            // Optimistic update or refetch? Let's just append for speed
            const newCommentObj = {
                // Map DB response to UI
                id: added.comment?.id || Date.now(),
                user: added.comment?.user_name || "You",
                text: added.comment?.content || newComment,
                timestamp: new Date().toISOString() // or formatDistanceToNow
            };
            setComments(prev => [newCommentObj, ...prev]);
            setNewComment("");
        } catch (e) {
            console.error("Comment failed", e);
            alert("Failed to post comment. Try again.");
        }
    };

    const handleSubscribe = async () => {
        if (!video) return;
        try {
            const newState = await toggleSubscription(video.channelName);
            setIsSubscribed(newState);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLike = async () => {
        if (!video) return;
        // Optimistic
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
        if (disliked) setDisliked(false);

        try {
            await toggleLike(video.id, 'like');
        } catch {
            // Revert if failed
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
        } catch {
            setDisliked(wasDisliked);
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
        <div className="flex flex-col lg:flex-row gap-0 md:gap-6 mx-auto md:px-6 md:pt-6 max-w-[1700px]">
            {/* Primary Column - Player & Info */}
            <div className="flex-1 min-w-0">
                {/* Player Container - Full width on mobile, no gap */}
                <div className="relative aspect-video bg-black sm:rounded-xl overflow-hidden sm:shadow-lg sm:ring-1 sm:ring-white/10">
                    {video.videoUrl ? (
                        <CustomPlayer src={video.videoUrl} poster={video.thumbnail} />
                    ) : (
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

                {/* Video Info - YouTube Mobile Layout */}
                <div className="px-3 sm:px-0">
                    {/* Title - 12px padding on mobile, mt-3 */}
                    <h1 className="mt-3 text-[18px] font-bold text-white line-clamp-2 leading-snug">
                        {video.title}
                    </h1>

                    {/* Views & Date - Compact Row */}
                    <p className="mt-1 text-[12px] text-gray-400">
                        {parseInt(video.views).toLocaleString()} views • {video.postedAt}
                    </p>

                    {/* Actions Row - YouTube style horizontal scroll */}
                    <div className="flex items-center gap-2 mt-3 -mx-3 px-3 overflow-x-auto no-scrollbar pb-2">
                        {/* Like/Dislike Segmented Pill */}
                        <div className="flex items-center bg-[#272727] rounded-full flex-shrink-0">
                            <button
                                onClick={handleLike}
                                className="flex items-center gap-1.5 pl-4 pr-3 py-2 rounded-l-full hover:bg-[#3f3f3f] transition-colors"
                                aria-label="Like video"
                            >
                                <ThumbsUp className={`w - 5 h - 5 ${liked ? "fill-white" : ""} `} />
                                <span className="text-[13px] font-medium">{likesCount}</span>
                            </button>
                            <div className="w-px h-6 bg-white/20"></div>
                            <button
                                onClick={handleDislike}
                                className="pl-3 pr-4 py-2 rounded-r-full hover:bg-[#3f3f3f] transition-colors"
                                aria-label="Dislike video"
                            >
                                <ThumbsDown className={`w - 5 h - 5 ${disliked ? "fill-white" : ""} `} />
                            </button>
                        </div>

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors text-white text-[13px] font-medium flex-shrink-0"
                        >
                            <Share2 className="w-5 h-5" />
                            <span>Share</span>
                        </button>

                        {/* More Button */}
                        <a
                            href={video.videoUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-[#272727] text-white hover:bg-[#3f3f3f] rounded-full transition-colors text-[13px] font-medium flex-shrink-0"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span>More</span>
                        </a>
                    </div>

                    {/* Channel Row - Avatar, Name, Subs, Subscribe Button */}
                    <div className="flex items-center gap-3 mt-3 py-3 border-t border-white/5">
                        <div className="w-10 h-10 rounded-full bg-j-green flex-shrink-0 overflow-hidden cursor-pointer hover:opacity-90 relative">
                            {video.channelAvatar ? (
                                <Image src={video.channelAvatar} alt={video.channelName} fill sizes="40px" className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-j-green" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-[14px] truncate hover:text-gray-200 cursor-pointer">{video.channelName}</h3>
                            <p className="text-[12px] text-gray-400">1.2K subscribers</p>
                        </div>
                        <button
                            onClick={handleSubscribe}
                            className={`px - 4 py - 2 rounded - full text - [14px] font - semibold transition - all flex - shrink - 0 ${isSubscribed
                                ? "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                                : "bg-white text-black hover:bg-gray-200"
                                } `}
                        >
                            {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                    </div>

                    {/* Description Box - YouTube Style */}
                    <div className="bg-[#272727] rounded-xl p-3 mt-1 text-sm hover:bg-[#3a3a3a] transition-colors cursor-pointer group">
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-white mb-1">
                            <span className="font-semibold">{parseInt(video.views).toLocaleString()} views</span>
                            <span className="font-semibold">{video.postedAt}</span>
                            <span className="text-gray-400">#Juneteenth #Atlanta</span>
                        </div>
                        <p className="text-[14px] text-white/90 whitespace-pre-line leading-relaxed line-clamp-2 group-hover:line-clamp-none">
                            {video.videoUrl ?
                                "Uploaded from your device. Watch and enjoy the highlights from this year's parade!" :
                                "Experience the vibrant energy of the 2024 Juneteenth Atlanta Parade! Featuring marching bands, dance troupes, and community floats."}
                        </p>
                        <button className="mt-2 text-white/60 text-[12px] group-hover:hidden">...more</button>
                    </div>
                </div>


                {/* Comments Section */}
                <div className="mt-6 px-3 sm:px-0 max-w-4xl">
                    <div className="flex items-center gap-8 mb-6">
                        <h3 className="text-xl font-bold text-white">{comments.length} Comments</h3>
                        {/* Sort button could go here */}
                    </div>

                    {/* Add Comment */}
                    <div className="flex items-start gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-j-red flex-shrink-0 flex items-center justify-center text-white font-bold text-lg select-none">
                            Y
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-transparent border-b border-white/20 pb-1 text-white placeholder-gray-400 focus:outline-none focus:border-white transition-colors text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                            />
                            <div className="flex justify-end mt-2 gap-2">
                                <button
                                    className="px-4 py-2 text-sm font-medium text-white hover:bg-[#272727] rounded-full transition-colors"
                                    onClick={() => setNewComment("")}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleComment}
                                    disabled={!newComment.trim()}
                                    className={`px - 4 py - 2 rounded - full text - sm font - medium transition - colors ${newComment.trim()
                                        ? "bg-[#3ea6ff] text-black hover:bg-[#65b8ff]"
                                        : "bg-[#272727] text-gray-500 cursor-not-allowed"
                                        } `}
                                >
                                    Comment
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <p className="text-gray-400 py-4">No comments yet.</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold select-none">
                                        {(comment.user_name || comment.user || "G")[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-bold text-white text-sm cursor-pointer hover:text-gray-300">@{comment.user_name || comment.user || "Guest"}</span>
                                            <span className="text-xs text-gray-400 hover:text-white cursor-pointer">
                                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : (comment.timestamp || "Just now")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white leading-normal">{comment.content || comment.text}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button
                                                className="flex items-center gap-1.5 text-gray-400 hover:text-white group-hover:opacity-100 opacity-0 transition-opacity"
                                                aria-label="Like comment"
                                            >
                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                <span className="text-xs"></span>
                                            </button>
                                            <button
                                                className="flex items-center text-gray-400 hover:text-white group-hover:opacity-100 opacity-0 transition-opacity"
                                                aria-label="Dislike comment"
                                            >
                                                <ThumbsDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="text-xs font-medium text-gray-400 hover:text-white rounded-full px-2 py-1 hover:bg-[#272727]">
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Secondary Column - Recommendations */}
            <div className="lg:w-[400px] xl:w-[420px] flex-shrink-0 space-y-2 hidden lg:block">
                {/* Filters potentially? */}
                <div className="flex gap-2 pb-4">
                    <button className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium">All</button>
                    <button className="bg-[#272727] text-white hover:bg-[#3f3f3f] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">From {video.channelName}</button>
                    <button className="bg-[#272727] text-white hover:bg-[#3f3f3f] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Related</button>
                </div>

                {videos.filter(v => v.id !== video?.id).map((v) => (
                    <a href={`/ watch / ${v.id} `} key={v.id} className="flex gap-2 cursor-pointer group hover:bg-[#272727] p-2 rounded-xl transition-colors">
                        <div className="w-[168px] aspect-video bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <Image src={v.thumbnail} fill sizes="168px" className="object-cover" alt={v.title} />
                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white font-medium tracking-wide">
                                {v.duration}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="font-bold text-white text-sm line-clamp-2 mb-1 group-hover:text-white transition-colors leading-tight">{v.title}</h4>
                            <p className="text-xs text-gray-400 hover:text-white transition-colors">{v.channelName}</p>
                            <p className="text-xs text-gray-400">{v.views} views • {v.postedAt}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 self-start p-1 -mr-2">
                            <MoreHorizontal className="w-5 h-5 text-white transform rotate-90" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
