"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoCard } from "@/components/video/VideoCard";
import { BookMarked, Clock } from "lucide-react";
import Link from "next/link";

export default function LibraryPage() {
    const { videos, watchLater, removeFromWatchLater } = useVideo();

    // Resolve Watch Later video IDs to full VideoProps
    const watchLaterVideos = watchLater
        .map(id => videos.find(v => v.id === id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined);

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <BookMarked className="w-6 h-6 text-j-gold" />
                <h1 className="text-2xl font-bold text-white">Library</h1>
            </div>

            {/* Watch Later Section */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-j-gold" />
                        <h2 className="text-lg font-semibold text-white">Watch Later</h2>
                        <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full font-medium">
                            {watchLaterVideos.length}
                        </span>
                    </div>
                    {watchLaterVideos.length > 0 && (
                        <Link href="/playlist/watch-later" className="text-sm text-j-gold hover:underline font-medium">
                            View all
                        </Link>
                    )}
                </div>

                {watchLaterVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/5 rounded-2xl text-center">
                        <Clock className="w-12 h-12 text-gray-600 mb-3" />
                        <h3 className="text-white font-semibold mb-1">No saved videos</h3>
                        <p className="text-gray-400 text-sm max-w-sm mb-4">
                            Tap <strong className="text-white">Save</strong> on any video to add it here for later.
                        </p>
                        <Link
                            href="/"
                            className="px-5 py-2 bg-j-gold hover:bg-yellow-400 text-black font-bold rounded-full text-sm transition-colors"
                        >
                            Browse Videos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {watchLaterVideos.map((video) => (
                            <div key={video.id} className="relative group">
                                <VideoCard video={video} />
                                <button
                                    onClick={() => removeFromWatchLater(video.id)}
                                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-red-600 text-white rounded-full p-1.5 backdrop-blur-sm"
                                    title="Remove from Watch Later"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
