"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Film } from "lucide-react";
import { CategoryBar } from "@/components/video/CategoryBar";
import { useState, useMemo } from "react";

const CATEGORIES = ["All", "SAREMBOK", "Parade", "Music", "Food", "History", "Speeches", "2024"] as const;

export default function GalleryPage() {
    const { videos, isLoading } = useVideo();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const filteredVideos = useMemo(() => {
        return videos.filter(v => selectedCategory === "All" || v.category === selectedCategory);
    }, [videos, selectedCategory]);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-j-red/20 rounded-lg flex items-center justify-center">
                        <Film className="w-5 h-5 text-j-red" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Video Gallery</h1>
                </div>
                <div className="h-1 w-20 bg-j-green rounded-full"></div>
                <p className="text-gray-400 mt-3">Browse our complete collection of videos</p>
            </header>

            {/* Filters */}
            <CategoryBar
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                className="mb-8"
            />

            {isLoading ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((j) => (
                            <div key={j} className="flex-shrink-0 w-full">
                                <div className="aspect-video rounded-2xl bg-[#111] border border-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent skeleton-shine" />
                                </div>
                                <div className="mt-3 flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#111] border border-white/5 flex-shrink-0 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent skeleton-shine" />
                                    </div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 w-full bg-[#111] rounded border border-white/5 relative overflow-hidden" />
                                        <div className="h-3 w-2/3 bg-[#111] rounded border border-white/5 relative overflow-hidden" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes skeleton-shine {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(100%); }
                        }
                        .skeleton-shine {
                            animation: skeleton-shine 2s infinite ease-in-out;
                        }
                    `}} />
                </>
            ) : filteredVideos.length > 0 ? (
                <VideoGrid videos={filteredVideos} />
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Film className="w-12 h-12 mb-4 opacity-50" />
                    <p>No videos matching &quot;{selectedCategory}&quot; found.</p>
                </div>
            )}
        </div>
    );
}
