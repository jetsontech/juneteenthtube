"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { VideoCard } from "@/components/video/VideoCard";
import { type VideoProps, useVideo } from "@/context/VideoContext";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { useStateFilter } from "@/context/StateContext";
import { useSearchParams } from "next/navigation";
import { CategoryBar } from "@/components/video/CategoryBar";

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

// Helper to parse duration string (e.g., "1:30", "0:45", "12:30") to seconds
function parseDurationToSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Deterministic shuffle with a seed — same seed = same order
function seededShuffle<T>(array: T[], seed: number): T[] {
  const newArray = [...array];
  let s = seed;
  for (let i = newArray.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647; // Park-Miller LCG
    const j = s % (i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const MAX_SHORT_DURATION = 60;

function HomeContent() {
  const { videos } = useVideo();
  const { selectedState } = useStateFilter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Generate a shuffle seed ONCE per page load — stays stable across re-renders
  const [shuffleSeed] = useState(() => Math.floor(Math.random() * 2147483647));

  // Filter videos EXCLUDING shorts (≤ 60s)
  const filteredVideos = useMemo(() => {
    const filtered = videos.filter(video => {
      const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        video.title.toLowerCase().includes(searchQuery) ||
        video.channelName.toLowerCase().includes(searchQuery);
      const matchesState = selectedState.code === "GLOBAL" ||
        video.state === selectedState.code ||
        video.state === "GLOBAL";
      const durationInSeconds = parseDurationToSeconds(video.duration);
      const isShort = durationInSeconds > 0 && durationInSeconds <= MAX_SHORT_DURATION;

      return matchesCategory && matchesSearch && matchesState && !isShort;
    });

    // Shuffle deterministically with per-session seed — same order until page reload
    return seededShuffle(filtered, shuffleSeed);
  }, [videos, selectedCategory, searchQuery, selectedState, shuffleSeed]);

  return (
    <>
      {/* Category Bar */}
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="content">

        {/* Heritage Banner */}
        {selectedCategory === "All" && !searchQuery && (
          <div className="heritage-banner">
            <div>
              <div className="banner-title">Juneteenth — June 19, 1865</div>
              <div className="banner-sub">
                Celebrating the day enslaved people in Texas learned of their freedom. Browse thousands of cultural videos, history, music, and more.
              </div>
            </div>
            <button className="banner-btn" onClick={() => setSelectedCategory("History")}>
              Explore History
            </button>
          </div>
        )}

        {/* Stats Row */}
        {selectedCategory === "All" && !searchQuery && (
          <div className="stats-row">
            {[
              { val: String(videos.length || "0"), lbl: "Videos Uploaded" },
              { val: "50", lbl: "States Covered" },
              { val: "2.1M", lbl: "Total Views" },
              { val: "1865", lbl: "Year of Freedom" },
            ].map(s => (
              <div className="stat-chip" key={s.lbl}>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {filteredVideos.length > 0 ? (
          <>
            <div className="section-header">
              <div className="section-title">
                {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === "All" ? "Featured Videos" : selectedCategory}
              </div>
              <a className="see-all-btn">See all</a>
            </div>

            {/* First 3 Videos */}
            <div className="video-grid">
              {filteredVideos.slice(0, 3).map(v => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>

            {/* Shorts Section */}
            {selectedCategory === "All" && !searchQuery && (
              <div className="mt-8 mb-4">
                <ShortsShelf title="Trending Shorts" horizontal={true} offset={0} />
              </div>
            )}

            {/* Remaining Videos */}
            {filteredVideos.length > 3 && (
              <>
                <div className="section-header" style={{ marginTop: 32 }}>
                  <div className="section-title">More to Watch</div>
                </div>
                <div className="video-grid">
                  {filteredVideos.slice(3).map(v => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <div className="empty-title">No videos found</div>
            <div className="empty-sub">Try a different category or state filter</div>
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
