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

  // Parse duration string to seconds
  const parseDurationToSeconds = (duration: string | undefined): number => {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  // Filter videos by category AND search query, EXCLUDING shorts (≤60s)
  // Shorts are displayed in the ShortsShelf component separately
  const MAX_SHORT_DURATION = 60;
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery) ||
      video.channelName.toLowerCase().includes(searchQuery);
    // Exclude shorts (videos ≤ 60s) from main grid - they appear in ShortsShelf
    const durationInSeconds = parseDurationToSeconds(video.duration);
    const isNotShort = durationInSeconds === 0 || durationInSeconds > MAX_SHORT_DURATION;
    return matchesCategory && matchesSearch && isNotShort;
  });

  // YouTube-style: 3 cols sidebar open, 4 cols sidebar closed on large screens
  // Mobile: single column with tight vertical spacing
  const videoGridClass = cn(
    "grid gap-x-4",
    "gap-y-4 sm:gap-y-6 lg:gap-y-8", // Tighter vertical gap on mobile
    isSidebarOpen
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  );

  return (
    <>
      {/* YouTube-style sticky category tabs */}
      <div className="sticky top-14 z-40 bg-transparent backdrop-blur-sm border-b border-white/5">
        <div className="px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
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

      {/* Main content area - YouTube mobile: minimal horizontal padding */}
      <main className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* First row of videos */}
        <div className={videoGridClass}>
          {filteredVideos.slice(0, isSidebarOpen ? 3 : 4).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Second row of videos */}
        <div className={cn(videoGridClass, "mt-3 sm:mt-6")}>
          {filteredVideos.slice(isSidebarOpen ? 3 : 4, isSidebarOpen ? 6 : 8).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Another Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Remaining Videos */}
        {filteredVideos.length > (isSidebarOpen ? 6 : 8) && (
          <div className="mt-3 sm:mt-6">
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
