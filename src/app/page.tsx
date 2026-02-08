"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { VideoGrid } from "@/components/video/VideoGrid";
import { VideoCard } from "@/components/video/VideoCard";
import { type VideoProps, useVideo } from "@/context/VideoContext";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { useStateFilter } from "@/context/StateContext";
import { useSearchParams } from "next/navigation";
import { CategoryBar } from "@/components/video/CategoryBar";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

function HomeContent() {
  const { videos } = useVideo();
  const { selectedState } = useStateFilter();
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

  // Filter videos by category, search query, state, EXCLUDING shorts (≤ 60s)
  const MAX_SHORT_DURATION = 60;

  const rawFilteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        video.title.toLowerCase().includes(searchQuery) ||
        video.channelName.toLowerCase().includes(searchQuery);

      // State filter: GLOBAL shows all videos, otherwise match the selected state
      const matchesState = selectedState.code === "GLOBAL" ||
        video.state === selectedState.code ||
        video.state === "GLOBAL"; // Global videos always show regardless of filter

      const durationInSeconds = parseDurationToSeconds(video.duration);
      const isShort = durationInSeconds > 0 && durationInSeconds <= MAX_SHORT_DURATION;

      return matchesCategory && matchesSearch && matchesState && !isShort;
    });
  }, [videos, selectedCategory, searchQuery, selectedState]);

  // Shuffle videos in useEffect to avoid impure render
  const [filteredVideos, setFilteredVideos] = useState<VideoProps[]>([]);

  useEffect(() => {
    const shuffled = shuffleArray(rawFilteredVideos);
    const timeoutId = setTimeout(() => {
      setFilteredVideos(shuffled);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [rawFilteredVideos]);

  // YouTube-style: Maximum 3 columns on desktop to maintain consistent card size
  // Mobile: single column with tighter vertical spacing
  const videoGridClass = cn(
    "grid gap-x-4",
    "gap-y-8 sm:gap-y-12 lg:gap-y-14", // Increased vertical gap for YouTube-style airy look
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
  );

  return (
    <>
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Main content area - YouTube mobile: minimal horizontal padding */}
      <div className="px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* First row of videos */}
        <div className={videoGridClass}>
          {filteredVideos.slice(0, 3).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Shorts Section (Vertical) */}
        {selectedCategory === "All" && (
          <ShortsShelf
            title="Shorts"
            horizontal={true}
            offset={0}
          />
        )}

        {/* Second row of videos */}
        <div className={cn(videoGridClass, "mt-8 sm:mt-12 lg:mt-14")}>
          {filteredVideos.slice(3, 6).map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Landscape Shorts Section (16:9) - Cinema Shorts */}
        {selectedCategory === "All" && (
          <ShortsShelf
            title="Cinema Shorts"
            offset={6}
            horizontal={true}
            landscapeMode={true}
          />
        )}

        {/* Remaining Videos */}
        {filteredVideos.length > 6 && (
          <div className="mt-8 sm:mt-12 lg:mt-14">
            <VideoGrid videos={filteredVideos.slice(6)} />
          </div>
        )}
      </div>
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
