"use client";

import { use, useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";
import { useVideo } from "@/context/VideoContext";
import { VideoProps } from "@/components/video/VideoCard";

export default function WatchPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const { getVideoById } = useVideo();
    const [video, setVideo] = useState<VideoProps | undefined>();

    useEffect(() => {
        if (resolvedParams.id) {
            setVideo(getVideoById(resolvedParams.id));
        }
    }, [resolvedParams.id, getVideoById]);

    if (!video) {
        return <div className="p-8 text-white text-center">Loading video...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto pt-4">
            {/* Primary Column - Player & Info */}
            <div className="flex-1 min-w-0">
                {/* Player Container */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                    {video.videoUrl ? (
                        <video
                            src={video.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        >
                            Your browser does not support the video tag.
                        </video>
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
                <div className="mt-4 space-y-4">
                    <h1 className="text-xl md:text-2xl font-bold text-white max-w-4xl line-clamp-2">
                        {video.title}
                    </h1>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Channel */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-j-green flex-shrink-0 overflow-hidden">
                                <img src={video.channelAvatar} alt={video.channelName} className="object-cover w-full h-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{video.channelName}</h3>
                                <p className="text-xs text-gray-400">Wait for sub count</p>
                            </div>
                            <button className="ml-4 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-full text-sm font-bold transition-colors">
                                Subscribe
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <div className="flex items-center bg-white/10 rounded-full">
                                <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-l-full border-r border-white/10 transition-colors">
                                    <ThumbsUp className="w-5 h-5" />
                                    <span className="text-sm font-medium">1.5K</span>
                                </button>
                                <button
                                    className="px-4 py-2 hover:bg-white/10 rounded-r-full transition-colors"
                                    title="Dislike"
                                >
                                    <ThumbsDown className="w-5 h-5" />
                                </button>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                                <Share2 className="w-5 h-5" />
                                <span className="text-sm font-medium">Share</span>
                            </button>

                            <button
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                title="More actions"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 rounded-xl p-4 text-sm mt-4 hover:bg-white/10 transition-colors">
                        <div className="flex gap-2 font-bold mb-2">
                            <span>{video.views} views</span>
                            <span>{video.postedAt}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-200">
                            {video.videoUrl ? "Uploaded from your device." : "Experience the vibrant energy of the 2024 Juneteenth Atlanta Parade! Featuring marching bands, dance troupes, and community floats. #Juneteenth #Atlanta #FreedomDay"}
                        </p>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-6 md:hidden">
                        <h3 className="font-bold mb-4">Comments</h3>
                        <p className="text-gray-400">Comments enabled.</p>
                    </div>
                </div>
            </div>

            {/* Secondary Column - Recommendations */}
            <div className="lg:w-[350px] xl:w-[400px] flex-shrink-0 space-y-4 hidden lg:block">
                <h3 className="font-bold mb-2">Up Next</h3>
                <div className="h-40 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="h-40 bg-white/5 rounded-xl animate-pulse"></div>
                <div className="h-40 bg-white/5 rounded-xl animate-pulse"></div>
            </div>
        </div>
    );
}
