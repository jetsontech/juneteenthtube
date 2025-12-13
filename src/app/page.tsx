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
    <div className="space-y-8 p-4 sm:p-6 pt-32">
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

        {/* ROW 1: [Blank, Stage, DJI_24] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 mb-8">
          {hasSpecial ? (
            row1.map((video, idx) => (
              video ? <VideoCard key={video.id} video={video} /> : <div key={`blank-r1-${idx}`} className="invisible" />
            ))
          ) : (
            // Fallback if specific videos missing (e.g. searching)
            remainingVideos.slice(0, 3).map(v => <VideoCard key={v.id} video={v} />)
          )}
        </div>

        {/* SHORTS 1 */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* ROW 2: [DJI_25, Fireworks, Blank] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 my-8">
          {hasSpecial ? (
            row2.map((video, idx) => (
              video ? <VideoCard key={video.id} video={video} /> : <div key={`blank-r2-${idx}`} className="invisible" />
            ))
          ) : (
            remainingVideos.slice(3, 6).map(v => <VideoCard key={v.id} video={v} />)
          )}
        </div>

        {/* SHORTS 2 */}
        {selectedCategory === "All" && <ShortsShelf />}

        {/* ROW 3+: Remaining Videos */}
        {remainingVideos.length > 0 && (
          <div className="mt-8">
            {/* If we used standard slicing fallback, we need to adjust slice index, but simpler to just show 'remaining' if 'hasSpecial' is true. 
                    If !hasSpecial, we already showed 0-6. So slice 6.
                */}
            <VideoGrid videos={hasSpecial ? remainingVideos : remainingVideos.slice(6)} />
          </div>
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
