"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { VideoCard } from "@/components/video/VideoCard";
import { type VideoProps, useVideo } from "@/context/VideoContext";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { useStateFilter } from "@/context/StateContext";
import { useSearchParams } from "next/navigation";
import { CategoryBar } from "@/components/video/CategoryBar";

const CATEGORIES = ["All", "SAREMBOK", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

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
      <CategoryBar
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        className="mb-4"
      />

      <div className="content">

        {/* Heritage Banner */}
        {selectedCategory === "All" && !searchQuery && (
          <div className="heritage-banner flex flex-col items-center justify-center text-center p-12 bg-zinc-900 rounded-3xl mb-8 relative overflow-hidden group border border-white/5 shadow-2xl">
            {/* Cinematic Animated Mesh Background */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#1f0505_0%,#2a1f05_50%,#051f05_100%)] bg-[length:200%_200%] animate-[mesh-sweep_20s_ease-in-out_infinite] opacity-40 pointer-events-none group-hover:scale-105 transition-transform duration-[3000ms] ease-out" />
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="banner-title text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                <span className="text-j-red">June</span>teenth — 1865
              </div>
              <div className="banner-sub text-lg sm:text-xl text-zinc-300 font-medium leading-relaxed mb-8 drop-shadow">
                Celebrating the day enslaved people in Texas learned of their freedom. Browse thousands of cultural videos, history, music, and more.
              </div>
            </div>
            <button
              className="banner-btn relative z-10 bg-j-gold hover:bg-yellow-400 text-black px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:scale-105 active:scale-95"
              onClick={() => setSelectedCategory("History")}
            >
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
              {filteredVideos.slice(0, 3).map((v, i) => (
                <div key={v.id} className={`animate-[revealUp_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 [animation-delay:${i * 120}ms]`}>
                  <VideoCard video={v} />
                </div>
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
                {/* Juneteenth Originals Hero */}
                <div className="section-header mt-8">
                  <h2 className="section-title">Juneteenth Originals</h2>
                </div>
                <div className="video-grid">
                  {filteredVideos.slice(3).map((v, i) => (
                    <div key={v.id} className={`animate-[revealUp_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0 [animation-delay:${(i % 12) * 80}ms]`}>
                      <VideoCard video={v} />
                    </div>
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
