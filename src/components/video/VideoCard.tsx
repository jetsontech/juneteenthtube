"use client";

import Image from "next/image";
import Link from "next/link";
import { type VideoProps } from "@/context/VideoContext";
import { useState, useRef, useEffect, useCallback, memo } from "react";

export { type VideoProps };

function VideoCardInner({ video }: { video: VideoProps }) {
    const [imgSrc, setImgSrc] = useState(video.thumbnail || "/placeholder.svg");
    const [hasError, setHasError] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isTouchPreviewing, setIsTouchPreviewing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const preventNavigationRef = useRef(false);
    const isHoveredRef = useRef(false);
    const [isHovered, setIsHovered] = useState(false);
    const [canHover, setCanHover] = useState(true);

    const previewSrc = video.videoUrl;

    const startPreview = useCallback(() => {
        setShowPreview(true);
    }, []);

    const stopPreview = useCallback(() => {
        // Use functional update to avoid synchronous dependency issues
        setShowPreview(prev => {
            if (prev && videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
            return false;
        });
    }, []);

    // Handle Video Playback
    useEffect(() => {
        if (showPreview && videoRef.current && previewSrc) {
            videoRef.current.src = previewSrc;
            videoRef.current.play().catch(() => { });
        }
    }, [showPreview, previewSrc]);

    // Handle Hover Capability Detection
    useEffect(() => {
        const hoverQuery = window.matchMedia("(hover: hover)");
        
        // Initial check: only set if different to avoid cascading renders
        if (canHover !== hoverQuery.matches) {
            setCanHover(hoverQuery.matches);
        }

        const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
        hoverQuery.addEventListener("change", handler);
        return () => hoverQuery.removeEventListener("change", handler);
    }, [canHover]);

    // Handle Desktop Hover Preview Logic
    useEffect(() => {
        if (!canHover) return;

        isHoveredRef.current = isHovered;
        let timeout: NodeJS.Timeout;

        if (isHovered) {
            timeout = setTimeout(() => {
                if (isHoveredRef.current) {
                    startPreview();
                }
            }, 600);
        } else {
            // Only trigger stop if we are actually showing a preview
            if (showPreview) {
                stopPreview();
            }
        }
        return () => clearTimeout(timeout);
    }, [isHovered, canHover, startPreview, stopPreview, showPreview]);

    const handleTouchStart = useCallback(() => {
        if (!previewSrc) return;
        preventNavigationRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            preventNavigationRef.current = true;
            setIsTouchPreviewing(true);
            startPreview();
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    }, [previewSrc, startPreview]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        if (isTouchPreviewing) {
            setIsTouchPreviewing(false);
            stopPreview();
        }
    }, [isTouchPreviewing, stopPreview]);

    const handleTouchMove = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (preventNavigationRef.current) {
            e.preventDefault();
            e.stopPropagation();
            preventNavigationRef.current = false;
        }
    }, []);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <div
                ref={cardRef}
                className={`video-card flex flex-col bg-white/[0.03] sm:bg-white/[0.04] backdrop-blur-sm sm:rounded-2xl sm:border sm:border-white/[0.06] overflow-hidden transition-colors duration-300 group-hover:bg-white/[0.06] ${isTouchPreviewing ? 'scale-[0.97] transition-transform' : ''}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <Image
                        src={imgSrc}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => {
                            if (!hasError) {
                                setImgSrc("/placeholder.svg");
                                setHasError(true);
                            }
                        }}
                    />
                    {showPreview && previewSrc && (
                        <video
                            ref={videoRef}
                            muted
                            loop
                            playsInline
                            preload="none"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
                    )}
                    {isTouchPreviewing && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1 animate-in fade-in duration-200">
                            <span className="w-1.5 h-1.5 bg-j-red rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Preview</span>
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[11px] font-medium text-white border border-white/10">
                        {video.duration}
                    </div>
                </div>
                <div className="flex gap-3 p-3 sm:p-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
                        {video.channelAvatar ? (
                            <Image
                                src={video.channelAvatar}
                                alt={video.channelName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-j-green flex items-center justify-center text-white font-bold">
                                {video.channelName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="line-clamp-2 text-[14px] font-semibold text-white leading-snug group-hover:text-j-gold transition-colors">
                            {video.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-zinc-400 hover:text-white transition-colors">
                            {video.channelName}
                        </p>
                        <div className="flex items-center text-[12px] text-zinc-400">
                            <span>{video.views} views</span>
                            <span className="mx-1">•</span>
                            <span>{video.postedAt}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export const VideoCard = memo(VideoCardInner, (prev, next) => {
    return prev.video.id === next.video.id && prev.video.thumbnail === next.video.thumbnail;
});
