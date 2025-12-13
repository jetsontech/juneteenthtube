"use client";

import { MoreVertical, Play } from "lucide-react";
import Link from "next/link";

interface ShortVideo {
    id: string;
    title: string;
    views: string;
    thumbnail: string;
}

// Mock Data for now
const MOCK_SHORTS: ShortVideo[] = [
    { id: "s1", title: "Drumline Battle @ Juneteenth 🥁", views: "1.2M", thumbnail: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=400&h=700&fit=crop" },
    { id: "s2", title: "Best Soul Food in ATL 🍗", views: "850K", thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=700&fit=crop" },
    { id: "s3", title: "Parade Vibes 2024 ✨", views: "2.1M", thumbnail: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=700&fit=crop" },
    { id: "s4", title: "Marching Band Warmup 🔥", views: "500K", thumbnail: "https://images.unsplash.com/photo-1543900694-133f37fba857?w=400&h=700&fit=crop" },
    { id: "s5", title: "Fireworks Finale!", views: "3.5M", thumbnail: "https://images.unsplash.com/photo-1498931299472-f7a63a029763?w=400&h=700&fit=crop" },
];

export function ShortsShelf() {
    return (
        <div className="py-8 border-y border-white/10 my-8">
            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-j-red"><path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.67-2.22-3.25zM10 14.65v-5.3L15 12l-5 2.65z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Shorts</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {MOCK_SHORTS.map((short) => (
                    <div key={short.id} className="group relative cursor-pointer">
                        <div className="relative aspect-[9/16] rounded-xl overflow-hidden mb-2">
                            <img src={short.thumbnail} alt={short.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="absolute top-2 right-2 p-1">
                                <MoreVertical className="text-white w-5 h-5 drop-shadow-md" />
                            </div>
                        </div>
                        <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1 group-hover:text-gray-200">{short.title}</h3>
                        <p className="text-gray-400 text-xs">{short.views} views</p>
                    </div>
                ))}
            </div>

            <button className="w-full mt-6 py-2 border-t border-b border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2">
                Show more <span className="text-xs">▼</span>
            </button>
        </div>
    );
}
