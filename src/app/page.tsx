"use client";

import { VideoGrid } from "@/components/video/VideoGrid";
import { useVideo } from "@/context/VideoContext";

export default function Home() {
  const { videos } = useVideo();

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"].map((tag, i) => (
          <button
            key={tag}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${i === 0
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4 text-white">Recommended</h2>
        <VideoGrid videos={videos} />
      </section>
    </div>
  );
}
