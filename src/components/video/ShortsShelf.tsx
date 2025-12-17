"use client";

import { MoreVertical, Play, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useVideo } from "@/context/VideoContext";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ShortVideo {
    id: string;
    title: string;
    views: string;
    thumbnail: string;
    videoUrl?: string;
    isPlaceholder?: boolean;
}

// Placeholder shorts (we'll use 5 or 6 based on sidebar state)
const PLACEHOLDER_SHORTS: ShortVideo[] = [
    { id: "p1", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
    { id: "p2", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
    { id: "p3", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
    { id: "p4", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
    { id: "p5", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
    { id: "p6", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/180x320/272727/666666?text=+", isPlaceholder: true },
];

function ShortCard({ short, onDelete, onChangeThumbnail }: {
    short: ShortVideo;
    onDelete?: (id: string) => void;
    onChangeThumbnail?: (id: string, file: File) => void;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsDeleting(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting && onDelete) {
            await onDelete(short.id);
            setIsMenuOpen(false);
        } else {
            setIsDeleting(true);
        }
    };

    const handleThumbnailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onChangeThumbnail) return;
        try {
            setIsUploadingThumb(true);
            await onChangeThumbnail(short.id, file);
        } catch (error) {
            console.error("Thumbnail update failed", error);
        } finally {
            setIsUploadingThumb(false);
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
        setIsDeleting(false);
    };

    const formatViews = (views: string | number) => {
        const num = typeof views === 'string' ? parseInt(views) : views;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (short.isPlaceholder) {
        return (
            <div className="group relative">
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#272727] flex items-center justify-center">
                    <div className="text-center p-2">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#3f3f3f] flex items-center justify-center">
                            <Play className="w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-500 line-clamp-2">{short.title}</h3>
            </div>
        );
    }

    return (
        <div className="group relative">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                title="Upload thumbnail"
                aria-label="Upload thumbnail"
            />

            <Link href={short.videoUrl ? `/watch/${short.id}` : "#"} className="block">
                <div className={cn(
                    "relative aspect-[9/16] rounded-xl overflow-hidden bg-[#1a1a1a]",
                    isUploadingThumb && "opacity-50"
                )}>
                    <img
                        src={short.thumbnail}
                        alt={short.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium">
                        <span>{formatViews(short.views)} views</span>
                    </div>
                </div>
            </Link>

            <h3 className="mt-2 text-sm font-medium text-white line-clamp-2 group-hover:text-gray-300">{short.title}</h3>

            <div className="absolute top-2 right-2 z-20" ref={menuRef}>
                <button
                    className={cn(
                        "p-1 rounded-full bg-black/60 hover:bg-black/80 transition-all",
                        isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={toggleMenu}
                    title="More options"
                    aria-label="More options"
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#282828] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                        <button
                            onClick={handleThumbnailClick}
                            className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2"
                        >
                            <ImageIcon size={14} />
                            Change Thumbnail
                        </button>
                        <button
                            onClick={handleDelete}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                                isDeleting ? "bg-red-500/20 text-red-400" : "text-red-400 hover:bg-white/10"
                            )}
                        >
                            <Trash2 size={14} />
                            {isDeleting ? "Confirm?" : "Delete"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ShortsShelf() {
    const { videos, deleteVideo, updateVideoThumbnail } = useVideo();
    const { isOpen: isSidebarOpen } = useSidebar();

    // YouTube-style: 5 shorts with sidebar open, 6 shorts with sidebar closed
    const shortsCount = isSidebarOpen ? 5 : 6;

    // Parse duration string (e.g., "1:30", "0:45", "12:30") to seconds
    const parseDurationToSeconds = (duration: string | undefined): number => {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
            // MM:SS format
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            // HH:MM:SS format
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    };

    // Filter videos to only include shorts (max 60 seconds / 1 minute)
    const MAX_SHORT_DURATION = 60; // 1 minute in seconds
    const shortsVideos = videos.filter(v => {
        const durationInSeconds = parseDurationToSeconds(v.duration);
        return durationInSeconds > 0 && durationInSeconds <= MAX_SHORT_DURATION;
    });

    // Use real shorts if available, fill remaining with placeholders
    const realShorts: ShortVideo[] = shortsVideos.slice(0, shortsCount).map(v => ({
        id: v.id,
        title: v.title,
        views: `${v.views || 0}`,
        thumbnail: v.thumbnail,
        videoUrl: v.videoUrl,
        isPlaceholder: false
    }));

    const placeholdersNeeded = Math.max(0, shortsCount - realShorts.length);
    const shorts = [...realShorts, ...PLACEHOLDER_SHORTS.slice(0, placeholdersNeeded)];

    const handleDelete = async (id: string) => {
        await deleteVideo(id);
    };

    const handleChangeThumbnail = async (id: string, file: File) => {
        await updateVideoThumbnail(id, file);
    };

    // YouTube-style: 5 cols with sidebar open, 6 cols with sidebar closed on large screens
    const gridClass = cn(
        "grid gap-3",
        isSidebarOpen
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    );

    return (
        <div className="py-6 border-y border-white/5 my-6">
            <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                    <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.67-2.22-3.25zM10 14.65v-5.3L15 12l-5 2.65z" />
                </svg>
                <h2 className="text-lg font-semibold text-white">Shorts</h2>
            </div>

            <div className={gridClass}>
                {shorts.map((short) => (
                    <ShortCard
                        key={short.id}
                        short={short}
                        onDelete={!short.isPlaceholder ? handleDelete : undefined}
                        onChangeThumbnail={!short.isPlaceholder ? handleChangeThumbnail : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
