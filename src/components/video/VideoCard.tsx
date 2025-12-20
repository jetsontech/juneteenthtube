"use client";

import { MoreVertical, Trash2, Edit2, X, Check, Image as ImageIcon, UploadCloud, Film } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useVideo } from "@/context/VideoContext";
import { formatDistanceToNow } from "date-fns";
import { useDominantColor } from "@/hooks/useDominantColor";

export interface VideoProps {
    id: string;
    title: string;
    thumbnail: string;
    channelName: string;
    channelAvatar?: string;
    views: string;
    postedAt: string;
    duration: string;
    videoUrl?: string;
    category?: string;
    likes?: number;
    createdAt?: string; // ISO String for better date formatting
}

export function VideoCard({ video }: { video: VideoProps }) {
    const { deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, isUploading, uploadProgress } = useVideo();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(video.title);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);


    // Extract dominant color from thumbnail for unique hover effect
    const dominantColor = useDominantColor(video.thumbnail);

    // ... existing refs
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoFileInputRef = useRef<HTMLInputElement>(null);

    const handleMouseEnter = () => {
        setIsCardHovered(true);
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(true);
        }, 600); // 600ms delay like YouTube
    };

    const handleMouseLeave = () => {
        setIsCardHovered(false);
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(false);
    };

    // Detect mobile screen for permanent glow effect
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsDeleting(false); // Reset delete confirmation state on close
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting) {
            await deleteVideo(video.id);
        } else {
            setIsDeleting(true);
        }
    };

    const handleSaveTitle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editTitle.trim() !== video.title) {
            await updateVideoTitle(video.id, editTitle);
        }
        setIsEditing(false);
        setIsMenuOpen(false);
    };

    const handleThumbnailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingThumb(true);
            await updateVideoThumbnail(video.id, file);
        } catch (error) {
            console.error("Thumbnail update failed", error);
            alert("Failed to update thumbnail");
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

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingVideo(true);
            await updateVideoFile(video.id, file);
        } catch (error) {
            console.error("Video update failed", error);
            alert("Failed to update video");
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // Format Date
    let timeAgo = video.postedAt;
    try {
        if (video.createdAt) {
            timeAgo = formatDistanceToNow(new Date(video.createdAt), { addSuffix: true });
        }
    } catch (e) {
        // Fallback to static string
    }

    // On mobile, always show the glow. On desktop, show on hover.
    const showGlow = isMobile || isCardHovered;

    return (
        <div
            className="group block relative p-2 -m-2 rounded-2xl transition-all duration-300 bg-[var(--card-hover-bg,transparent)] ring-1 ring-white/5 hover:ring-white/10 shadow-lg shadow-black/20"
            style={{ "--card-hover-bg": showGlow ? dominantColor : 'transparent' } as React.CSSProperties}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                aria-label="Upload thumbnail"
                title="Upload thumbnail"
            />
            <input
                type="file"
                ref={videoFileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleVideoFileChange}
                aria-label="Upload video"
                title="Upload video"
            />

            <Link href={`/watch/${video.id}`} className="block relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                {/* Video Preview on Hover */}
                {isHovered && video.videoUrl ? (
                    <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        // @ts-ignore
                        webkit-playsinline="true"
                        onLoadedData={(e) => {
                            // Ensure it plays even if low power mode tries to stop it
                            e.currentTarget.play().catch(() => { });
                        }}
                    />
                ) : null}

                {/* Thumbnail Image */}
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className={cn(
                        "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                        isHovered && video.videoUrl ? "opacity-0" : "opacity-100",
                        isUploadingThumb && "opacity-50 blur-sm"
                    )}
                />

                {isUploadingThumb && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <UploadCloud className="w-8 h-8 text-white animate-pulse" />
                    </div>
                )}

                {/* Duration Badge (Hide on hover if playing?) - YouTube keeps it usually, or moves it. Let's keep it. */}
                <div className={cn(
                    "absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-semibold text-white z-20 transition-opacity",
                    isHovered && video.videoUrl ? "opacity-0" : "opacity-100"
                )}>
                    {video.duration}
                </div>

                {/* Hover Controls (Audio & CC) */}
                {isHovered && video.videoUrl && (
                    <div className="absolute top-2 right-2 flex gap-2 z-30 animate-in fade-in duration-200">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Toggle Captions (Mock)
                            }}
                            className="p-1.5 bg-black/60 hover:bg-black/80 rounded transition-colors text-white"
                            title="Subtitles/closed captions (c)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M11 12h.01" /><path d="M15 12h.01" /></svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const videoEl = e.currentTarget.closest('.group')?.querySelector('video');
                                if (videoEl) {
                                    videoEl.muted = !videoEl.muted;
                                    // Force re-render not needed for native prop, but icon change needs state?
                                    // We can just toggle the class or use state if we lifted it. 
                                    // Simpler: use a ref or local state for the icon.
                                    // For now, let's rely on component state.
                                    setIsMuted(!isMuted);
                                }
                            }}
                            className="p-1.5 bg-black/60 hover:bg-black/80 rounded transition-colors text-white"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" x2="17" y1="9" y2="15" /><line x1="17" x2="23" y1="9" y2="15" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                            )}
                        </button>
                    </div>
                )}
            </Link>

            {/* Info */}
            <div className="flex gap-3 mt-3 px-1 sm:px-0 pr-2">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <Link href={`/channel/${video.channelName}`} className="w-9 h-9 rounded-full bg-j-green overflow-hidden block">
                        <img src={video.channelAvatar} alt={video.channelName} className="w-full h-full object-cover" />
                    </Link>
                </div>

                {/* Text */}
                <div className="flex flex-col flex-1 gap-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-2 z-20 relative">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-gray-800 text-white text-sm p-1 rounded border border-gray-600 w-full focus:outline-none focus:border-j-gold"
                                autoFocus
                                onClick={(e) => e.preventDefault()}
                                aria-label="Edit video title"
                            />
                            <button
                                onClick={handleSaveTitle}
                                className="p-1 hover:bg-green-500/20 rounded-full text-green-500"
                                aria-label="Save title"
                                title="Save"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); setIsEditing(false); }}
                                className="p-1 hover:bg-red-500/20 rounded-full text-red-500"
                                aria-label="Cancel edit"
                                title="Cancel"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link href={`/watch/${video.id}`} className="block">
                            <h3 className="text-white font-semibold line-clamp-2 leading-tight group-hover:text-j-gold transition-colors" title={video.title}>
                                {video.title}
                            </h3>
                        </Link>
                    )}

                    <div className="text-sm text-gray-400">
                        <p className="hover:text-white transition-colors">{video.channelName}</p>
                        <div className="flex items-center text-xs">
                            <span>{video.views} views</span>
                            <span className="mx-1">•</span>
                            <span>{timeAgo}</span>
                        </div>
                    </div>
                </div>

                {/* Menu Button */}
                <div className="relative" ref={menuRef}>
                    <button
                        className={cn(
                            "p-1 hover:bg-white/10 rounded-full transition-all h-fit",
                            isMenuOpen ? "opacity-100 bg-white/10" : "opacity-0 group-hover:opacity-100"
                        )}
                        onClick={toggleMenu}
                        aria-label="Action menu"
                    >
                        <MoreVertical className="w-5 h-5 text-white" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                            <button
                                onClick={handleThumbnailClick}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                            >
                                <ImageIcon size={14} />
                                Change Thumb
                            </button>
                            <button
                                onClick={handleVideoClick}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                            >
                                <Film size={14} />
                                Change Video
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                            >
                                <Edit2 size={14} />
                                Rename
                            </button>
                            <button
                                onClick={handleDelete}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                                    isDeleting ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "text-red-400 hover:bg-white/10"
                                )}
                            >
                                <Trash2 size={14} />
                                {isDeleting ? "Confirm?" : "Delete"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
