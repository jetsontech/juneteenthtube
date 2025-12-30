"use client";

import { VideoGrid } from "@/components/video/VideoGrid";
import { useVideo } from "@/context/VideoContext";

import { VideoProps } from "@/components/video/VideoCard";

interface SectionPageProps {
    title: string;
    filter?: (video: VideoProps) => boolean;
    emptyMessage?: string;
}

export function SectionPage({ title, filter, emptyMessage = "No videos found in this section." }: SectionPageProps) {
    const { videos } = useVideo();

    // Apply filter if provided, otherwise show all (or could be empty for some pages)
    const displayVideos = filter ? videos.filter(filter) : videos;

    return (
        <div className="space-y-8 p-4 sm:p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <div className="h-1 w-20 bg-j-red rounded-full"></div>
            </header>

            {displayVideos.length > 0 ? (
                <VideoGrid videos={displayVideos} />
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📺</span>
                    </div>
                    <p>{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}
