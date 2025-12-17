"use client";

import { MoreVertical, Play, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useVideo } from "@/context/VideoContext";
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

// Placeholder shorts - 5 items to match YouTube layout
const PLACEHOLDER_SHORTS: ShortVideo[] = [
    { id: "p1", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/400x700/1a1a1a/666666?text=+", isPlaceholder: true },
    { id: "p2", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/400x700/1a1a1a/666666?text=+", isPlaceholder: true },
    { id: "p3", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/400x700/1a1a1a/666666?text=+", isPlaceholder: true },
    { id: "p4", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/400x700/1a1a1a/666666?text=+", isPlaceholder: true },
    { id: "p5", title: "Upload Your First Short", views: "0", thumbnail: "https://placehold.co/400x700/1a1a1a/666666?text=+", isPlaceholder: true },
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

    // Close menu when clicking outside
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

    // Format views
    const formatViews = (views: string | number) => {
        const num = typeof views === 'string' ? parseInt(views) : views;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (short.isPlaceholder) {
        return (
            <div className="group relative cursor-default">
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-800/50 border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <div className="text-center p-4">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-500 text-xs">Upload a Short</p>
                    </div>
                </div>
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
            />

            <Link
                href={short.videoUrl ? `/watch/${short.id}` : "#"}
                className="block"
            >
                <div className={cn(
                    "relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-900",
                    isUploadingThumb && "opacity-50"
                )}>
                    <img
                        src={short.thumbnail}
                        alt={short.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                    </div>

                    {/* Views badge */}
                    <div className="absolute bottom-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
                        <p className="text-white text-[10px] font-medium">{formatViews(short.views)} views</p>
                    </div>

                    {/* Title at bottom */}
                    <div className="absolute bottom-8 left-2 right-8">
                        <h3 className="text-white text-sm font-semibold line-clamp-2 drop-shadow-lg">{short.title}</h3>
                    </div>
                </div>
            </Link>

            {/* Menu Button */}
            <div className="absolute top-2 right-2 z-20" ref={menuRef}>
                <button
                    className={cn(
                        "p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-all",
                        isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={toggleMenu}
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                        <button
                            onClick={handleThumbnailClick}
                            className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2"
                        >
                            <ImageIcon size={12} />
                            Change Thumbnail
                        </button>
                        <button
                            onClick={handleDelete}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                                isDeleting ? "bg-red-500/20 text-red-500" : "text-red-400 hover:bg-white/10"
                            )}
                        >
                            <Trash2 size={12} />
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

    // Use real videos if available, fill remaining slots with placeholders
    const realShorts: ShortVideo[] = videos.slice(0, 5).map(v => ({
        id: v.id,
        title: v.title,
        views: `${v.views || 0}`,
        thumbnail: v.thumbnail,
        videoUrl: v.videoUrl,
        isPlaceholder: false
    }));

    // Fill remaining slots with placeholders to always show 5
    const placeholdersNeeded = Math.max(0, 5 - realShorts.length);
    const shorts = [...realShorts, ...PLACEHOLDER_SHORTS.slice(0, placeholdersNeeded)];

    const handleDelete = async (id: string) => {
        await deleteVideo(id);
    };

    const handleChangeThumbnail = async (id: string, file: File) => {
        await updateVideoThumbnail(id, file);
    };

    return (
        <div className="py-6 border-y border-white/10 my-6">
            {/* Header - YouTube Style */}
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="w-6 h-6 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                        <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.67-2.22-3.25zM10 14.65v-5.3L15 12l-5 2.65z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">Shorts</h2>
            </div>

            {/* 5 Column Grid - YouTube Style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
