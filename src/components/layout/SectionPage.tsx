"use client";

import { VideoGrid } from "@/components/video/VideoGrid";
import { useVideo } from "@/context/VideoContext";
import { CategoryBar } from "@/components/video/CategoryBar";
import { useState, useMemo } from "react";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

import { type VideoProps } from "@/context/VideoContext";

interface SectionPageProps {
    title: string;
    filter?: (video: VideoProps) => boolean;
    emptyMessage?: string;
}

export function SectionPage({ title, filter, emptyMessage = "No videos found in this section." }: SectionPageProps) {
    const { videos } = useVideo();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    // Apply filter if provided, otherwise show all
    const displayVideos = useMemo(() => {
        let filtered = filter ? videos.filter(filter) : videos;
        if (selectedCategory !== "All") {
            filtered = filtered.filter(v => v.category === selectedCategory);
        }
        return filtered;
    }, [videos, filter, selectedCategory]);

    return (
        <div className="space-y-6">
            <header className="px-4 sm:px-6 pt-6">
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <div className="h-1 w-20 bg-j-red rounded-full"></div>
            </header>

            <CategoryBar
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
            />

            <div className="px-4 sm:px-6 pb-6">
                {displayVideos.length > 0 ? (
                    <VideoGrid videos={displayVideos} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📺</span>
                        </div>
                        <p>{selectedCategory === "All" ? emptyMessage : `No videos matching "${selectedCategory}" found.`}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
