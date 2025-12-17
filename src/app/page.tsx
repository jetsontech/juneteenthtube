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

  // Specific Curated Videos (Hardcoded Placement)
  const stageVideo = videos.find(v => v.title.includes("Juneteenth Stage"));
  const dji24Video = videos.find(v => v.title.includes("DJI_2024"));
  const dji25Video = videos.find(v => v.title.includes("DJI_2025"));
  const fireworksVideo = videos.find(v => v.title.includes("Fireworks Finale"));

  // Build rows if we found the specific videos, otherwise fallback to standard slicing
  const hasSpecial = stageVideo && dji24Video && dji25Video && fireworksVideo;

  // Ids to exclude from 'remaining'
  const excludedIds = [stageVideo?.id, dji24Video?.id, dji25Video?.id, fireworksVideo?.id].filter(Boolean) as string[];

  const remainingVideos = filteredVideos.filter(v => !excludedIds.includes(v.id));

  // Custom Row 1: [Blank, Stage, DJI_24]
  const row1 = [null, stageVideo, dji24Video];
  // Custom Row 2: [DJI_25, Fireworks, Blank]
  const row2 = [dji25Video, fireworksVideo, null];

  return (
    <div className="p-4 sm:p-6 pt-4">
      {/* Categories - YouTube style sticky tabs */}
      <div className="sticky top-16 z-30 bg-[#0f0f0f] pb-3 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
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

      <section className="mt-4 space-y-6">
        <h2 className="text-lg font-semibold text-white">
          {selectedCategory === "All" ? "Recommended" : selectedCategory}
        </h2>

        {/* ROW 1 - Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {hasSpecial ? (
            row1.filter(Boolean).map((video) => (
              <VideoCard key={video!.id} video={video!} />
            ))
          ) : (
            remainingVideos.slice(0, 4).map(v => <VideoCard key={v.id} video={v} />)
          )}
        </div>

        {/* SHORTS 1 */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* ROW 2 - Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {hasSpecial ? (
            row2.filter(Boolean).map((video) => (
              <VideoCard key={video!.id} video={video!} />
            ))
          ) : (
            remainingVideos.slice(4, 8).map(v => <VideoCard key={v.id} video={v} />)
          )}
        </div>

        {/* SHORTS 2 */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* ROW 3+: Remaining Videos */}
        {remainingVideos.length > 0 && (
          <VideoGrid videos={hasSpecial ? remainingVideos : remainingVideos.slice(8)} />
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-white p-8 text-center">Loading videos...</div>}>
      <HomeContent />
    </Suspense>
  );
}
