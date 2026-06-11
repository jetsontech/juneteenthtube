"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoCard } from "@/components/video/VideoCard";
import { History, Trash2 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
    const { watchHistory, clearHistory } = useVideo();

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Watch History</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {watchHistory.length} video{watchHistory.length !== 1 ? 's' : ''} watched
                    </p>
                </div>
                {watchHistory.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-gray-400 rounded-xl transition-all text-sm font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear History
                    </button>
                )}
            </div>

            {watchHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <History className="w-10 h-10 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">No watch history yet</h2>
                    <p className="text-gray-400 max-w-sm mb-6">
                        Videos you watch will appear here. Start exploring to build your history.
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-j-red hover:bg-red-700 text-white font-semibold rounded-full transition-colors"
                    >
                        Explore Videos
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {watchHistory.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </main>
    );
}
