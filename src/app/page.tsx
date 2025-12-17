"use client";

import { useState, Suspense } from "react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { VideoCard } from "@/components/video/VideoCard";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { useVideo } from "@/context/VideoContext";
import { useSearchParams } from "next/navigation";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

function HomeContent() {
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
    <>
      {/* YouTube-style sticky category tabs */}
      <div className="sticky top-14 z-40 bg-[#0f0f0f] border-b border-white/5">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedCategory(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === tag
                    ? "bg-white text-black"
                    : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area - YouTube-style layout */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Grid - 4 columns on xl, 3 on lg, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
          {filteredVideos.slice(0, 4).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* More Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 mt-6">
          {filteredVideos.slice(4, 8).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Another Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Remaining Videos */}
        {filteredVideos.length > 8 && (
          <div className="mt-6">
            <VideoGrid videos={filteredVideos.slice(8)} />
          </div>
        )}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-white p-8 text-center">Loading videos...</div>}>
      <HomeContent />
    </Suspense>
  );
}
