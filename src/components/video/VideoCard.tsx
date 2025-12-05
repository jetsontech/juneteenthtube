"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface VideoProps {
    id: string;
    title: string;
    thumbnail: string;
    channelName: string;
    channelAvatar: string;
    views: string;
    postedAt: string;
    duration: string;
    videoUrl?: string;
}

export function VideoCard({ video }: { video: VideoProps }) {
    return (
        <Link href={`/watch/${video.id}`} className="group block">
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-semibold text-white">
                    {video.duration}
                </div>
            </div>

            {/* Info */}
            <div className="flex gap-3 mt-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-j-green overflow-hidden">
                        <img src={video.channelAvatar} alt={video.channelName} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Text */}
                <div className="flex flex-col flex-1 gap-1">
                    <h3 className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-j-gold transition-colors">
                        {video.title}
                    </h3>
                    <div className="text-sm text-gray-400">
                        <p className="hover:text-white transition-colors">{video.channelName}</p>
                        <div className="flex items-center">
                            <span>{video.views} views</span>
                            <span className="mx-1">•</span>
                            <span>{video.postedAt}</span>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <button
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-full transition-all h-fit"
                    onClick={(e) => {
                        e.preventDefault();
                        // Menu logic
                    }}
                    aria-label="Action menu"
                >
                    <MoreVertical className="w-5 h-5 text-white" />
                </button>
            </div>
        </Link>
    );
}
