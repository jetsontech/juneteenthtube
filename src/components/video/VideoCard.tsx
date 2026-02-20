import Image from "next/image";
import Link from "next/link";
import { type VideoProps } from "@/context/VideoContext";
import { useState, useRef, useEffect, useCallback, memo } from "react";

export { type VideoProps };

/**
 * VideoCard — Performance-optimized video card component
 * 
 * Key optimizations:
 * 1. <video> element is LAZY — only created when preview actually triggers
 * 2. No IntersectionObserver auto-play on mobile (crash cause)
 * 3. Desktop: hover preview after 600ms delay
 * 4. Mobile: long-press preview only (intentional interaction)
 * 5. Global mutual exclusion — only 1 preview plays at a time
 * 6. Memoized to prevent re-renders when parent re-renders
 */
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

    // Global mutual exclusion for previews — only 1 plays at a time
    useEffect(() => {
        const handlePreviewStart = (e: CustomEvent) => {
            if (e.detail.id !== video.id) {
                setShowPreview(false);
                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load(); // Release memory
                }
            }
        };

        window.addEventListener('juneteenth:preview-start', handlePreviewStart as EventListener);
        return () => window.removeEventListener('juneteenth:preview-start', handlePreviewStart as EventListener);
    }, [video.id]);

    const startPreview = useCallback(() => {
        // Broadcast "I am playing" — all other cards will stop
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('juneteenth:preview-start', { detail: { id: video.id } }));
        }
        setShowPreview(true);
    }, [video.id]);

    // When showPreview becomes true AND we have a video ref, start playing
    useEffect(() => {
        if (showPreview && videoRef.current && previewSrc) {
            videoRef.current.src = previewSrc;
            videoRef.current.play().catch(() => { });
        }
    }, [showPreview, previewSrc]);

    // Detect hover capability
    useEffect(() => {
        const hoverQuery = window.matchMedia("(hover: hover)");
        setCanHover(hoverQuery.matches);
        const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
        hoverQuery.addEventListener("change", handler);
        return () => hoverQuery.removeEventListener("change", handler);
    }, []);

    // Desktop hover preview — 600ms delay before playing
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
            setShowPreview(false);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load(); // Release memory immediately
            }
        }
        return () => clearTimeout(timeout);
    }, [isHovered, canHover, startPreview]);

    // NO IntersectionObserver auto-play on mobile — this was the #1 crash cause
    // Mobile users tap to navigate, or long-press to preview

    // Touch handlers (long-press to preview)
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
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
            setShowPreview(false);
        }
    }, [isTouchPreviewing]);

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
                {/* Thumbnail */}
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
                    {/* LAZY video element — only rendered when preview is active */}
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
                {/* Info */}
                <div className="flex gap-3 p-3 sm:p-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
                        {video.channelAvatar ? (
                            <Image
                                src={video.channelAvatar}
                                alt={video.channelName}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
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

// Memoize — only re-render if the video object identity changes
export const VideoCard = memo(VideoCardInner, (prev, next) => {
    return prev.video.id === next.video.id && prev.video.thumbnail === next.video.thumbnail;
});
