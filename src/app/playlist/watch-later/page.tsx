"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoCard } from "@/components/video/VideoCard";
import { Clock, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const translations = new Map<string, string>([
    ["watchLater", "Watch Later"],
    ["playlistEmpty", "Your playlist is empty"],
    ["explorePrompt", "Explore videos and save them here so you can watch them at your convenience."],
    ["discoverContent", "Discover Content"]
]);

const t = (key: string) => {
    return translations.get(key) || key;
};

export default function WatchLaterPage() {
    const { videos, watchLater, removeFromWatchLater } = useVideo();

    // Resolve Watch Later video IDs to full VideoProps
    const watchLaterVideos = watchLater
        .map(id => videos.find(v => v.id === id))
        .filter((v): v is NonNullable<typeof v> => v !== undefined);

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link
                        href="/library"
                        className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-all"
                        title="Back to Library"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-j-gold" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">{t("watchLater")}</h1>
                        <span className="px-2.5 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full font-bold">
                            {watchLaterVideos.length}
                        </span>
                    </div>
                </div>
            </div>

            {watchLaterVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
                    <Clock className="w-16 h-16 text-gray-600 mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-white mb-2">{t("playlistEmpty")}</h2>
                    <p className="text-gray-400 text-sm max-w-sm mb-6">
                        {t("explorePrompt")}
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-gradient-to-r from-j-green to-j-gold hover:from-green-600 hover:to-yellow-500 text-black font-black rounded-full text-xs uppercase tracking-widest transition-all shadow-lg shadow-j-gold/10"
                    >
                        {t("discoverContent")}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {watchLaterVideos.map((video) => (
                        <div key={video.id} className="relative group">
                            <VideoCard video={video} />
                            <button
                                onClick={() => removeFromWatchLater(video.id)}
                                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 hover:bg-red-600 text-white rounded-full p-2 backdrop-blur-md shadow-lg"
                                title="Remove from Watch Later"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

