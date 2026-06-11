"use client";

import { useParams } from "next/navigation";
import { useVideo } from "@/context/VideoContext";
import { VideoCard } from "@/components/video/VideoCard";
import { User, Film, Eye } from "lucide-react";
import { useMemo, useState } from "react";

export default function ChannelPage() {
    const params = useParams();
    const channelName = decodeURIComponent(params.name as string);
    const { videos } = useVideo();
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('popular');

    const channelVideos = useMemo(() => {
        const filtered = videos.filter(
            (video) => video.channelName.toLowerCase() === channelName.toLowerCase()
        );

        return [...filtered].sort((a, b) => {
            if (sortBy === 'popular') {
                const parseViews = (v: string) => {
                    const cleaned = v.replace(/,/g, "");
                    const num = parseFloat(cleaned);
                    if (cleaned.includes("M")) return num * 1_000_000;
                    if (cleaned.includes("K")) return num * 1_000;
                    return num || 0;
                };
                return parseViews(b.views) - parseViews(a.views);
            }
            return 0; // default order for recent
        });
    }, [videos, channelName, sortBy]);

    const totalViews = useMemo(() => {
        const total = channelVideos.reduce((sum, v) => {
            const cleaned = v.views.replace(/,/g, "");
            const num = parseFloat(cleaned);
            if (cleaned.includes("M")) return sum + num * 1_000_000;
            if (cleaned.includes("K")) return sum + num * 1_000;
            return sum + (num || 0);
        }, 0);

        if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`;
        if (total >= 1_000) return `${(total / 1_000).toFixed(1)}K`;
        return total.toString();
    }, [channelVideos]);

    const initials = channelName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    return (
        <main className="min-h-screen pb-12">
            {/* Banner */}
            <div className="relative h-32 sm:h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-zinc-900 to-emerald-900/30" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.15),transparent_50%)]" />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
            </div>

            {/* Channel Info */}
            <div className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto -mt-12 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-8">
                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-500 flex items-center justify-center text-white font-black text-2xl sm:text-4xl ring-4 ring-[#0f0f0f] shadow-2xl flex-shrink-0">
                        {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            {channelName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <Film className="w-3.5 h-3.5" />
                                {channelVideos.length} video{channelVideos.length !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                {totalViews} total views
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                    <button
                        onClick={() => setSortBy('popular')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            sortBy === 'popular'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Most Popular
                    </button>
                    <button
                        onClick={() => setSortBy('recent')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            sortBy === 'recent'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Recently Added
                    </button>
                </div>

                {/* Videos Grid */}
                {channelVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <User className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
                        <p className="text-zinc-400 max-w-sm">
                            This channel hasn&apos;t uploaded any content yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {channelVideos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
