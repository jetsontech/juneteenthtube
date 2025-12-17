"use client";

import { MoreVertical, Play } from "lucide-react";
import Link from "next/link";
import { useVideo } from "@/context/VideoContext";

interface ShortVideo {
    id: string;
    title: string;
    views: string;
    thumbnail: string;
    videoUrl?: string;
}

// Mock Data for now - reduced to 4
const MOCK_SHORTS: ShortVideo[] = [
    { id: "s1", title: "Drumline Battle @ Juneteenth 🥁", views: "1.2M", thumbnail: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&h=700&fit=crop" },
    { id: "s2", title: "Best Soul Food in ATL 🍗", views: "850K", thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=700&fit=crop" },
    { id: "s3", title: "Parade Vibes 2024 ✨", views: "2.1M", thumbnail: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=700&fit=crop" },
    { id: "s4", title: "Marching Band Warmup 🔥", views: "500K", thumbnail: "https://images.unsplash.com/photo-1543900694-133f37fba857?w=400&h=700&fit=crop" },
];

export function ShortsShelf() {
    const { videos } = useVideo();

    // Use real videos if available, otherwise mock data
    const shorts: ShortVideo[] = videos.length > 0
        ? videos.slice(0, 4).map(v => ({
            id: v.id,
            title: v.title,
            views: `${v.views || 0}`,
            thumbnail: v.thumbnail,
            videoUrl: v.videoUrl
        }))
        : MOCK_SHORTS;

    return (
        <div className="py-8 border-y border-white/10 my-8">
            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-7 h-7 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-j-red"><path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.67-2.22-3.25zM10 14.65v-5.3L15 12l-5 2.65z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Shorts</h2>
            </div>

            {/* Changed to 4 columns max, with larger sizing */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {shorts.map((short) => (
                    <Link
                        key={short.id}
                        href={short.videoUrl ? `/watch/${short.id}` : "#"}
                        className="group relative cursor-pointer block"
                    >
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-3 shadow-lg shadow-black/30">
                            <img src={short.thumbnail} alt={short.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Play button overlay on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Play className="w-7 h-7 text-white fill-white" />
                                </div>
                            </div>

                            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="text-white w-5 h-5" />
                            </div>

                            {/* Views badge */}
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1">
                                <p className="text-white text-xs font-medium">{short.views} views</p>
                            </div>
                        </div>
                        <h3 className="font-bold text-white text-base line-clamp-2 leading-tight group-hover:text-gray-200 transition-colors">{short.title}</h3>
                    </Link>
                ))}
            </div>

            <button className="w-full mt-8 py-3 border-t border-b border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 rounded-lg">
                Show more <span className="text-xs">▼</span>
            </button>
        </div>
    );
}
