import Image from "next/image";
import Link from "next/link";
import { type VideoProps } from "@/context/VideoContext";
import { useState, useRef, useEffect, useCallback } from "react";

export { type VideoProps };

export function VideoCard({ video }: { video: VideoProps }) {
    const thumb = video.thumbnail || "/placeholder-thumb.jpg";
    const [isHovered, setIsHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTouchDeviceRef = useRef(false);

    // Detect touch capability once
    useEffect(() => {
        isTouchDeviceRef.current =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia("(pointer: coarse)").matches;
    }, []);

    // Desktop hover: delay then play
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isHovered && !isTouchDeviceRef.current && videoRef.current) {
            timeout = setTimeout(() => {
                setShowPreview(true);
                videoRef.current?.play().catch(() => { });
            }, 500);
        } else if (!isHovered && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setShowPreview(false);
        }
        return () => clearTimeout(timeout);
    }, [isHovered]);

    // Mobile: IntersectionObserver auto-play when card is >60% visible
    useEffect(() => {
        if (typeof window === "undefined") return;
        // Only apply for touch devices
        const isTouch =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia("(pointer: coarse)").matches;
        if (!isTouch || !cardRef.current || !video.videoUrl) return;

        let playTimeout: NodeJS.Timeout;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Delay slightly so rapid scrolling doesn't trigger dozens of plays
                    playTimeout = setTimeout(() => {
                        setShowPreview(true);
                        videoRef.current?.play().catch(() => { });
                    }, 800);
                } else {
                    clearTimeout(playTimeout);
                    if (videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                    }
                    setShowPreview(false);
                }
            },
            { threshold: 0.6 }
        );

        observer.observe(cardRef.current);
        return () => {
            clearTimeout(playTimeout);
            observer.disconnect();
        };
    }, [video.videoUrl]);

    // Mobile long-press handlers
    const handleTouchStart = useCallback(() => {
        if (!video.videoUrl) return;
        longPressTimerRef.current = setTimeout(() => {
            setShowPreview(true);
            videoRef.current?.play().catch(() => { });
        }, 500);
    }, [video.videoUrl]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card Container — glass background, edge-to-edge on mobile */}
            <div
                ref={cardRef}
                className="flex flex-col bg-white/[0.03] sm:bg-white/[0.04] backdrop-blur-sm sm:rounded-2xl sm:border sm:border-white/[0.06] overflow-hidden transition-colors duration-300 group-hover:bg-white/[0.06]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                {/* Thumbnail */}
                <div className={`relative aspect-video w-full overflow-hidden bg-zinc-900 ${showPreview ? "ring-2 ring-j-gold/60 ring-inset" : ""}`}>
                    <Image
                        src={thumb}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${showPreview ? 'opacity-0' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {video.videoUrl && (
                        <video
                            ref={videoRef}
                            src={video.videoUrl}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${showPreview ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        />
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[11px] font-medium text-white border border-white/10">
                        {video.duration}
                    </div>
                </div>
                {/* Info */}
                <div className="flex gap-3 p-3 sm:p-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
                        {video.channelAvatar ? (
                            <Image src={video.channelAvatar} alt={video.channelName} fill className="object-cover" />
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
