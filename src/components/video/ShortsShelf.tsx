"use client";

import { MoreVertical, Play, Trash2, Image as ImageIcon, Film, Edit2, X, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    duration?: string;
}

const PLACEHOLDER_SHORTS: ShortVideo[] = [];

function ShortCard({ short, onDelete, onChangeThumbnail, onChangeVideo, onRename, landscapeMode = false }: {
    short: ShortVideo;
    onDelete?: (id: string) => void;
    onChangeThumbnail?: (id: string, file: File) => void;
    onChangeVideo?: (id: string, file: File) => void;
    onRename?: (id: string, newTitle: string) => void;
    landscapeMode?: boolean;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(short.title);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoFileInputRef = useRef<HTMLInputElement>(null);

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

    const handleVideoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        videoFileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleRenameClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setIsMenuOpen(false);
    };

    const handleSaveTitle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editTitle.trim() !== short.title && onRename) {
            await onRename(short.id, editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditTitle(short.title);
        setIsEditing(false);
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onChangeVideo) return;
        try {
            setIsUploadingVideo(true);
            await onChangeVideo(short.id, file);
        } catch (error) {
            console.error("Video update failed", error);
        } finally {
            setIsUploadingVideo(false);
        }
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
                <div className={cn(
                    "relative rounded-xl overflow-hidden bg-[#272727] flex items-center justify-center",
                    landscapeMode ? "aspect-video" : "aspect-[9/16]"
                )}>
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
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} title="Upload Thumbnail" aria-label="Upload Thumbnail" />
            <input type="file" ref={videoFileInputRef} className="hidden" accept="video/*" onChange={handleVideoFileChange} title="Upload Video" aria-label="Upload Video" />

            <Link href={short.videoUrl ? `/shorts/${short.id}?mode=${landscapeMode ? 'landscape' : 'portrait'}` : "#"} className="block">
                <div className={cn(
                    "relative rounded-xl overflow-hidden bg-[#1a1a1a]",
                    landscapeMode ? "aspect-video" : "aspect-[9/16]",
                    (isUploadingThumb || isUploadingVideo) && "opacity-50"
                )}>
                    <Image
                        src={short.thumbnail || "/placeholder.svg"}
                        alt={short.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 180px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium">
                        <span>{formatViews(short.views)} views</span>
                    </div>
                    {isUploadingVideo && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-white text-sm font-medium">Uploading...</span>
                        </div>
                    )}
                </div>
            </Link>

            {isEditing ? (
                <div className="mt-2 flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-[#272727] text-white text-sm px-2 py-1 rounded border border-white/20 focus:outline-none focus:border-white/50"
                        placeholder="Video title"
                        title="Edit video title"
                        aria-label="Edit video title"
                        autoFocus
                    />
                    <button onClick={handleSaveTitle} className="p-1 hover:bg-white/10 rounded" title="Save" aria-label="Save"><Check className="w-4 h-4 text-green-500" /></button>
                    <button onClick={handleCancelEdit} className="p-1 hover:bg-white/10 rounded" title="Cancel" aria-label="Cancel"><X className="w-4 h-4 text-red-500" /></button>
                </div>
            ) : (
                <h3 className="mt-2 text-sm font-medium text-white line-clamp-2 group-hover:text-gray-300">{short.title}</h3>
            )}

            <div className="absolute top-2 right-2 z-20" ref={menuRef}>
                <button
                    className={cn("p-1 rounded-full bg-black/60 hover:bg-black/80 transition-all", isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                    onClick={toggleMenu}
                    title="Menu"
                    aria-label="Menu"
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-[#282828] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                        <button onClick={handleThumbnailClick} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2">
                            <ImageIcon size={14} /> Change Thumbnail
                        </button>
                        <button onClick={handleVideoClick} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2">
                            <Film size={14} /> Change Video
                        </button>
                        <button onClick={handleRenameClick} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 flex items-center gap-2">
                            <Edit2 size={14} /> Rename
                        </button>
                        <button
                            onClick={handleDelete}
                            className={cn("w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors", isDeleting ? "bg-red-500/20 text-red-400" : "text-red-400 hover:bg-white/10")}
                        >
                            <Trash2 size={14} /> {isDeleting ? "Confirm?" : "Delete"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ShortsShelf({ offset = 0, horizontal = false, landscapeMode = false, title }: { offset?: number; horizontal?: boolean; landscapeMode?: boolean; title?: string } = {}) {
    const { videos, deleteVideo, updateVideoThumbnail, updateVideoFile, updateVideoTitle } = useVideo();
    const { isOpen: isSidebarOpen } = useSidebar();

    const SHORTS_TO_RENDER = 12;

    const parseDurationToSeconds = (duration: string | undefined): number => {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        return parts.length === 2 ? parts[0] * 60 + parts[1] : parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0;
    };

    const MAX_SHORT_DURATION = 60;
    const shortsVideos = videos.filter(v => {
        const durationInSeconds = parseDurationToSeconds(v.duration);
        return durationInSeconds > 0 && durationInSeconds <= MAX_SHORT_DURATION;
    });

    const realShorts: ShortVideo[] = shortsVideos.slice(offset, offset + SHORTS_TO_RENDER).map(v => ({
        id: v.id,
        title: v.title,
        views: `${v.views || 0}`,
        thumbnail: v.thumbnail,
        videoUrl: v.videoUrl,
        isPlaceholder: false
    }));

    const placeholdersNeeded = Math.max(0, SHORTS_TO_RENDER - realShorts.length);
    const shorts = [...realShorts, ...PLACEHOLDER_SHORTS.slice(0, Math.min(placeholdersNeeded, 6))];

    const gridClass = cn("grid gap-3", isSidebarOpen ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6");
    const horizontalClass = "flex gap-3 overflow-x-auto scrollbar-none pb-2";

    return (
        <div className="py-6 border-y border-white/5 my-6">
            <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                    <path d="M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.67-2.22-3.25zM10 14.65v-5.3L15 12l-5 2.65z" />
                </svg>
                <h2 className="text-lg font-semibold text-white">{title || 'Shorts'}</h2>
            </div>
            <div className={horizontal ? horizontalClass : gridClass}>
                {shorts.map((short) => (
                    <div key={short.id} className={horizontal ? "flex-shrink-0 w-[140px] sm:w-[180px]" : ""}>
                        <ShortCard
                            short={short}
                            onDelete={!short.isPlaceholder ? deleteVideo : undefined}
                            onChangeThumbnail={!short.isPlaceholder ? updateVideoThumbnail : undefined}
                            onChangeVideo={!short.isPlaceholder ? updateVideoFile : undefined}
                            onRename={!short.isPlaceholder ? updateVideoTitle : undefined}
                            landscapeMode={landscapeMode}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
