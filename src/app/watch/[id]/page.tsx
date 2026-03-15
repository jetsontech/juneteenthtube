"use client";

import { use, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { CategoryBar } from "@/components/video/CategoryBar";
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

const CATEGORIES = ["All", "SAREMBOK", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

export default function WatchPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const { getVideoById, videos, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription } = useVideo();
    const [sidebarCategory, setSidebarCategory] = useState<string>("All");

    // Derived Recommendations logic
    const filteredSidebarVideos = useMemo(() => {
        return videos
            .filter(v => v.id !== resolvedParams.id)
            .filter(v => sidebarCategory === "All" || v.category === sidebarCategory);
    }, [videos, resolvedParams.id, sidebarCategory]);


    // Derived State (No side effects)
    const video = useMemo(() => {
        if (!resolvedParams.id || videos.length === 0) return undefined;
        const v = getVideoById(resolvedParams.id);

        // If the ID looks like it's from a mock but isn't found, 
        // it might be because the context is still loading or has different IDs
        return v;
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
            const newCommentObj = {
                id: added.comment?.id || Date.now(),
                user: added.comment?.user_name || "You",
                text: added.comment?.content || newComment,
                timestamp: new Date().toISOString()
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
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
        if (disliked) setDisliked(false);

        try {
            await toggleLike(video.id, 'like');
        } catch {
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
        <div className="flex flex-col sm:block h-[calc(100dvh-3.5rem)] sm:h-auto overflow-hidden sm:overflow-visible bg-transparent relative z-0">
            {/* Ambient Home-style Background for Watch Page */}
            <div className="absolute top-0 right-0 w-[80vw] sm:w-[50vw] h-[60vh] bg-[radial-gradient(circle_at_100%_0%,_#3f2e05_0%,_transparent_70%)] opacity-40 pointer-events-none z-[-1]" />
            <div className="absolute top-[20vh] left-0 w-[100vw] h-[80vh] bg-[radial-gradient(circle_at_50%_50%,_#4a0000_0%,_transparent_60%)] opacity-20 pointer-events-none z-[-1]" />
            <div className="absolute bottom-0 left-0 w-[80vw] sm:w-[50vw] h-[50vh] bg-[radial-gradient(circle_at_0%_100%,_#0a2f0a_0%,_transparent_70%)] opacity-30 pointer-events-none z-[-1]" />

            {/* Player - stays at top on mobile */}
            <div className="flex-shrink-0 relative z-10 pt-4 sm:pt-6 w-full max-w-[1400px] mx-auto">
                <div className="relative aspect-video w-full bg-black overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_30px_90px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:rounded-2xl sm:mx-6 group">
                    {/* Inner subtle glow removed per user request */}
                    {video.videoUrl ? (
                        <CustomPlayer
                            src={video.videoUrl}
                            srcH264={video.videoUrlH264}
                            poster={video.thumbnail}
                        />
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
            </div>

            {/* Scrollable content - scrolls independently under the player on mobile */}
            {/* Added overscroll-y-contain to prevent scroll chaining/bouncing that causes shifting */}
            <div className="flex-1 overflow-y-auto sm:overflow-visible bg-transparent relative z-10 overscroll-y-contain pb-10">
                <div className="max-w-[1700px] mx-auto px-0 md:px-6">
                    {/* Video Info */}
                    <div className="px-3 sm:px-0 mt-4 sm:mt-6">
                        <h1 className="text-[20px] sm:text-[24px] font-black text-white leading-tight tracking-tight drop-shadow-md">
                            {video.title}
                        </h1>

                        <p className="mt-2 text-[13px] text-gray-400 font-medium tracking-wide">
                            {parseInt(video.views).toLocaleString()} VIEWS • {video.postedAt.toUpperCase()}
                        </p>

                        {/* Actions Row */}
                        <div className="flex items-center gap-3 mt-4 -mx-3 px-3 overflow-x-auto no-scrollbar pb-2">
                            <div className="flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex-shrink-0 shadow-lg">
                                <button
                                    onClick={handleLike}
                                    className="flex items-center gap-2 pl-5 pr-4 py-2.5 rounded-l-full hover:bg-white/10 transition-colors"
                                    aria-label="Like video"
                                >
                                    <ThumbsUp className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
                                    <span className="text-[13px] font-bold">{likesCount}</span>
                                </button>
                                <div className="w-px h-6 bg-white/20"></div>
                                <button
                                    onClick={handleDislike}
                                    className="pl-4 pr-5 py-2.5 rounded-r-full hover:bg-white/10 transition-colors"
                                    aria-label="Dislike video"
                                >
                                    <ThumbsDown className={`w-5 h-5 ${disliked ? "fill-white" : ""}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-full transition-all text-white text-[13px] font-bold flex-shrink-0 shadow-lg active:scale-95"
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Share</span>
                            </button>

                            <a
                                href={video.videoUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-full transition-all text-white text-[13px] font-bold flex-shrink-0 shadow-lg active:scale-95"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                                <span>More</span>
                            </a>
                        </div>

                        {/* Channel Row */}
                        <div className="flex items-center gap-4 mt-6 py-4 px-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner">
                            <div className="w-12 h-12 rounded-full bg-j-green flex-shrink-0 overflow-hidden cursor-pointer hover:scale-105 transition-transform relative ring-2 ring-white/10">
                                {video.channelAvatar ? (
                                    <Image src={video.channelAvatar} alt={video.channelName} fill sizes="48px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-j-green to-j-gold flex items-center justify-center text-white font-black text-lg">
                                        {video.channelName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <h3 className="font-bold text-white text-[15px] truncate hover:text-j-gold transition-colors cursor-pointer">{video.channelName}</h3>
                                <p className="text-[12px] text-gray-400 font-medium">1.2K subscribers</p>
                            </div>
                            <button
                                onClick={handleSubscribe}
                                className={`px-5 py-2.5 rounded-full text-[13px] font-black uppercase tracking-wider transition-all flex-shrink-0 shadow-lg ${isSubscribed
                                    ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                                    : "bg-white text-black hover:bg-gray-200"
                                    }`}
                            >
                                {isSubscribed ? "Subscribed" : "Subscribe"}
                            </button>
                        </div>

                        {/* Description Box */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mt-4 text-sm hover:bg-white/10 transition-colors cursor-pointer group shadow-lg">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-white mb-2">
                                <span className="font-bold">{parseInt(video.views).toLocaleString()} views</span>
                                <span className="font-bold">{video.postedAt}</span>
                                <span className="text-j-gold font-medium">#Juneteenth #Atlanta</span>
                            </div>
                            <p className="text-[14px] text-white/90 whitespace-pre-line leading-relaxed line-clamp-2 group-hover:line-clamp-none font-medium">
                                {video.videoUrl ?
                                    "Uploaded from your device. Watch and enjoy the highlights from this year's parade!" :
                                    "Experience the vibrant energy of the 2024 Juneteenth Atlanta Parade! Featuring marching bands, dance troupes, and community floats."}
                            </p>
                            <button className="mt-3 text-white/50 text-[12px] font-bold uppercase tracking-widest group-hover:hidden">Show More</button>
                        </div>
                    </div>

                    {/* Recommendations Section */}
                    {/* Added min-h block to ensure layout stays stable even if grid reflows */}
                    <div className="w-full mt-8 border-t border-white/5 pt-8 min-h-[50vh]">
                        <div className="px-3 sm:px-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-bold text-white flex-shrink-0">Recommended for you</h3>
                            <CategoryBar
                                categories={CATEGORIES}
                                selectedCategory={sidebarCategory}
                                onCategoryChange={setSidebarCategory}
                                className="bg-transparent border-none px-0"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 px-3 sm:px-0">
                            {filteredSidebarVideos.map((v) => (
                                <Link href={`/watch/${v.id}`} key={v.id} className="flex flex-col gap-3 cursor-pointer group">
                                    <div className="w-full aspect-video bg-gray-800 rounded-2xl overflow-hidden relative shadow-lg group-hover:shadow-white/5 transition-all">
                                        {v.thumbnail ? (
                                            <Image
                                                src={v.thumbnail}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                alt={v.title}
                                                // Priority true on first few items prevents CLS (Layout Shift)
                                                priority={v === filteredSidebarVideos[0] || v === filteredSidebarVideos[1]}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                                <span className="text-gray-500 text-xs">No Thumbnail</span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[11px] text-white font-bold backdrop-blur-sm">
                                            {v.duration}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-9 h-9 rounded-full bg-j-green flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                                            {v.channelAvatar ? (
                                                <Image src={v.channelAvatar} width={36} height={36} className="rounded-full object-cover" alt={v.channelName} />
                                            ) : (
                                                v.channelName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-bold text-white text-[14px] line-clamp-2 mb-1 group-hover:text-j-gold transition-colors leading-snug">{v.title}</h4>
                                            <p className="text-[12px] text-gray-400 font-medium truncate">{v.channelName}</p>
                                            <p className="text-[12px] text-gray-400 truncate">{v.views} views • {v.postedAt}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-12 px-3 sm:px-0 max-w-4xl border-t border-white/5 pt-12">
                        <div className="flex items-center gap-8 mb-6">
                            <h3 className="text-xl font-bold text-white">{comments.length} Comments</h3>
                        </div>

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
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${newComment.trim()
                                            ? "bg-[#3ea6ff] text-black hover:bg-[#65b8ff]"
                                            : "bg-[#272727] text-gray-500 cursor-not-allowed"
                                            }`}
                                    >
                                        Comment
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pb-20">
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
            </div>
        </div>
    );
}
