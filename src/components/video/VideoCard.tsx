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
        setShowPreview(prev => {
            if (prev && videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
            return false;
        });
    }, []);

    useEffect(() => {
        if (showPreview && videoRef.current && previewSrc) {
            videoRef.current.src = previewSrc;
            videoRef.current.play().catch(() => { });
        }
    }, [showPreview, previewSrc]);

    // FIXED: Using setTimeout to move setState out of the synchronous effect body
    useEffect(() => {
        const hoverQuery = window.matchMedia("(hover: hover)");

        const updateHover = () => {
            setTimeout(() => {
                setCanHover(hoverQuery.matches);
            }, 0);
        };

        updateHover(); // Initial check

        const handler = (e: MediaQueryListEvent) => {
            setTimeout(() => {
                setCanHover(e.matches);
            }, 0);
        };
        hoverQuery.addEventListener("change", handler);
        return () => hoverQuery.removeEventListener("change", handler);
    }, []);

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

            // Async to satisfy synchronous setState in effect rule
            setTimeout(() => setShowPreview(false), 0);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load(); // Release memory immediately
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
        console.log(`[VideoCard] Clicked: ${video.id}, preventNavigation: ${preventNavigationRef.current}`);
        if (preventNavigationRef.current) {
            e.preventDefault();
            e.stopPropagation();
            preventNavigationRef.current = false;
        }
    }, [video.id]);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="vcard premium-card gloss-shine shadow-2xl transition-all duration-500"
            onMouseEnter={() => {
                setIsHovered(true);
                preventNavigationRef.current = false; // Reset on every hover to be safe
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            <div ref={cardRef} className="vcard-content relative aspect-video w-full overflow-hidden bg-zinc-900 group">
                <div className="gloss-overlay" />
                <Image
                    src={imgSrc}
                    alt={video.title}
                    fill
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
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 bg-j-red rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Preview</span>
                    </div>
                )}
                <div className="category-tag">{video.category}</div>
                <div className="duration-badge">{video.duration}</div>
            </div>

            <div className="vcard-body">
                <div className="channel-avatar">
                    {video.channelAvatar ? (
                        <Image
                            src={video.channelAvatar}
                            alt={video.channelName}
                            fill
                            className="object-cover rounded-full border border-white/10"
                        />
                    ) : (
                        video.channelName.charAt(0).toUpperCase()
                    )}
                </div>
                <div className="vcard-info">
                    <h3 className="vcard-title">{video.title}</h3>
                    <p className="vcard-channel">{video.channelName}</p>
                    <div className="vcard-meta">
                        <span>{video.views} views</span>
                        <span>•</span>
                        <span>{video.postedAt}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export const VideoCard = memo(VideoCardInner, (prev, next) => {
    return prev.video.id === next.video.id && prev.video.thumbnail === next.video.thumbnail;
});
