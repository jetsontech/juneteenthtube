"use client";

import { useParams } from "next/navigation";
import { useVideo } from "@/context/VideoContext";
import { VideoGrid } from "@/components/video/VideoGrid";
import { User } from "lucide-react";

export default function ChannelPage() {
    const params = useParams();
    const channelName = decodeURIComponent(params.name as string);
    const { videos } = useVideo();

    // Filter videos by channel name
    const channelVideos = videos.filter(
        (video) => video.channelName.toLowerCase() === channelName.toLowerCase()
    );

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Channel Header */}
            <div className="bg-gradient-to-r from-j-red/20 to-j-gold/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-j-green rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{channelName}</h1>
                        <p className="text-gray-400">{channelVideos.length} videos</p>
                    </div>
                </div>
            </div>

            {/* Videos */}
            {channelVideos.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-400">No videos from this channel yet.</p>
                </div>
            ) : (
                <VideoGrid videos={channelVideos} />
            )}
        </main>
    );
}
