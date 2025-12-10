"use client";

import { useState, useEffect } from "react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { useVideo } from "@/context/VideoContext";
import { useSearchParams } from "next/navigation";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

export default function Home() {
  const { videos } = useVideo();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter videos by category AND search query
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery) ||
      video.channelName.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedCategory(tag)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === tag
              ? "bg-white text-black"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 text-white">
          {selectedCategory === "All" ? "Recommended" : selectedCategory}
        </h2>
        <VideoGrid videos={filteredVideos} />
      </section>
    </div>
  );
}
