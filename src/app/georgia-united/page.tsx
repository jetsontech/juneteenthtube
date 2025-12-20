"use client";

import { Flag, Play, MapPin } from "lucide-react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { useVideo } from "@/context/VideoContext";
import Link from "next/link";

export default function GeorgiaUnitedPage() {
    const { videos } = useVideo();

    // Filter for Georgia-related content (can be expanded with proper tagging later)
    const georgiaVideos = videos.filter(video =>
        video.title?.toLowerCase().includes('georgia') ||
        video.title?.toLowerCase().includes('atlanta') ||
        video.channelName?.toLowerCase().includes('georgia') ||
        video.channelName?.toLowerCase().includes('atlanta') ||
        video.category?.toLowerCase().includes('georgia')
    );

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-j-red/20 via-black to-j-green/20 border-b border-white/10">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

                <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    <div className="max-w-4xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-j-red/20 border border-j-red/30 rounded-full mb-4">
                            <MapPin className="w-4 h-4 text-j-red" />
                            <span className="text-sm font-medium text-j-red">Georgia</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Georgia <span className="text-j-gold">United</span>
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-gray-300 mb-6 max-w-2xl">
                            Celebrating Juneteenth across Georgia. From Atlanta to Savannah, explore videos showcasing
                            Georgia's rich Juneteenth heritage and community celebrations.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-j-gold/20 rounded-lg flex items-center justify-center">
                                    <Play className="w-5 h-5 text-j-gold" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{georgiaVideos.length}</p>
                                    <p className="text-xs text-gray-400">Videos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-j-green/20 rounded-lg flex items-center justify-center">
                                    <Flag className="w-5 h-5 text-j-green" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">Georgia</p>
                                    <p className="text-xs text-gray-400">Region</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Featured Content</h2>
                    <div className="h-1 flex-1 max-w-[100px] bg-j-red rounded-full ml-4" />
                </div>

                {georgiaVideos.length > 0 ? (
                    <VideoGrid videos={georgiaVideos} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <div className="w-20 h-20 bg-j-gold/10 rounded-full flex items-center justify-center mb-4">
                            <Flag className="w-10 h-10 text-j-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Georgia Content Coming Soon</h3>
                        <p className="text-gray-400 text-center max-w-md mb-6">
                            We're curating the best Juneteenth content from across Georgia.
                            Check back soon or upload your own Georgia celebration videos!
                        </p>
                        <Link
                            href="/"
                            className="px-6 py-2.5 bg-j-red hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Explore All Videos
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
