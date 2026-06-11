"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Film, Loader2 } from "lucide-react";
import { CategoryBar } from "@/components/video/CategoryBar";
import { useState, useMemo } from "react";
import { useStateFilter } from "@/context/StateContext";

const CATEGORIES = ["All", "SAREMBOK", "Parade", "Music", "Food", "History", "Speeches", "2024"] as const;

export default function GalleryPage() {
    const { videos, isLoading } = useVideo();
    const { selectedState } = useStateFilter();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    const filteredVideos = useMemo(() => {
        const stateFiltered = !selectedState || selectedState.code === "GLOBAL"
            ? videos
            : videos.filter((v) => v.state === selectedState.code || v.state === "GLOBAL");
        return stateFiltered.filter(v => selectedCategory === "All" || v.category === selectedCategory);
    }, [videos, selectedState, selectedCategory]);

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

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-j-gold animate-spin" />
                </div>
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
