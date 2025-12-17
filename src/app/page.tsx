"use client";

import { useState, Suspense } from "react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { VideoCard } from "@/components/video/VideoCard";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { useVideo } from "@/context/VideoContext";
import { useSidebar } from "@/context/SidebarContext";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

function HomeContent() {
  const { videos } = useVideo();
  const { isOpen: isSidebarOpen } = useSidebar();
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

  // YouTube-style: 3 cols sidebar open, 4 cols sidebar closed on large screens
  const videoGridClass = cn(
    "grid gap-x-4 gap-y-10",
    isSidebarOpen
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  return (
    <>
      {/* YouTube-style sticky category tabs */}
      <div className="sticky top-14 z-40 bg-transparent backdrop-blur-sm border-b border-white/5">
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

      {/* Main content area */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* First row of videos */}
        <div className={videoGridClass}>
          {filteredVideos.slice(0, isSidebarOpen ? 3 : 4).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Second row of videos */}
        <div className={cn(videoGridClass, "mt-6")}>
          {filteredVideos.slice(isSidebarOpen ? 3 : 4, isSidebarOpen ? 6 : 8).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Another Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Remaining Videos */}
        {filteredVideos.length > (isSidebarOpen ? 6 : 8) && (
          <div className="mt-6">
            <VideoGrid videos={filteredVideos.slice(isSidebarOpen ? 6 : 8)} />
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
