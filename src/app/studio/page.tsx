"use client";

import { useVideo } from "@/context/VideoContext";
import { VideoCard } from "@/components/video/VideoCard";
import { Upload, Video } from "lucide-react";

export default function StudioPage() {
    const { videos } = useVideo();

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Juneteenth Studio</h1>
                <div className="flex items-center gap-2 text-gray-400">
                    <Video className="w-5 h-5" />
                    <span>{videos.length} videos</span>
                </div>
            </div>

            {videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Upload className="w-16 h-16 text-gray-600 mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
                    <p className="text-gray-400">Upload your first video to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </main>
    );
}
