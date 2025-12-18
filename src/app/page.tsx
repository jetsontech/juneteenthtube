"use client";

import { useState, Suspense } from "react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { VideoCard, type VideoProps } from "@/components/video/VideoCard";
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

  // Helper to parse duration string (e.g., "1:30", "0:45", "12:30") to seconds
  const parseDurationToSeconds = (duration: string | undefined): number => {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Filter videos by category AND search query, EXCLUDING shorts (≤ 60s)
  const MAX_SHORT_DURATION = 60;
  const rawFilteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery) ||
      video.channelName.toLowerCase().includes(searchQuery);

    const durationInSeconds = parseDurationToSeconds(video.duration);
    const isShort = durationInSeconds > 0 && durationInSeconds <= MAX_SHORT_DURATION;

    return matchesCategory && matchesSearch && !isShort;
  });

  // Pin Ad Video (if exists in data or use placeholder)
  // For now, let's treat the first video as the potential "Ad" slot if we want to pin a specific one,
  // or use a placeholder if needed.
  // The user wants the first "SLOT" locked for advertisers.
  const AD_VIDEO: VideoProps = {
    id: "advertisement-01",
    title: "Project Juneteenth | Official Advertisement",
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1000&auto=format&fit=crop",
    channelName: "Juneteenth Global",
    channelAvatar: "https://juneteenthatl.com/wp-content/uploads/2024/01/Juneteenth-Atlanta-Logo.png",
    views: "Sponsored",
    postedAt: "Just Now",
    duration: "Ad",
    videoUrl: "", // Ad video URL
    category: "Sponsored"
  };

  // Shuffle all videos except for specific pinned content if needed
  // For now, we'll shuffle everything and then prepend the AD.
  const shuffledVideos = shuffleArray(rawFilteredVideos);
  const filteredVideos = [AD_VIDEO, ...shuffledVideos];

  // YouTube-style: Always 3 columns on desktop to maintain consistent card size
  // Mobile: single column with tighter vertical spacing
  const videoGridClass = cn(
    "grid gap-x-4",
    "gap-y-8 sm:gap-y-12 lg:gap-y-14", // Increased vertical gap for YouTube-style airy look
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
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
          {filteredVideos.slice(0, 3).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Shorts Section */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* Second row of videos */}
        <div className={cn(videoGridClass, "mt-8 sm:mt-12 lg:mt-14")}>
          {filteredVideos.slice(3, 6).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Second Shorts Section - shows next set of videos */}
        {selectedCategory === "All" && <ShortsShelf offset={6} />}

        {/* Remaining Videos */}
        {filteredVideos.length > 6 && (
          <div className="mt-8 sm:mt-12 lg:mt-14">
            <VideoGrid videos={filteredVideos.slice(6)} />
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
