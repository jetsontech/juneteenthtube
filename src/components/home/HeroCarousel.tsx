"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { VideoProps } from "@/context/VideoContext";
import { Play } from "lucide-react";

interface HeroCarouselProps {
    videos: VideoProps[];
}

export function HeroCarousel({ videos }: HeroCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const featured = videos.slice(0, 5);

    const next = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % featured.length);
    }, [featured.length]);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        if (isPaused || featured.length <= 1) return;
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [isPaused, next, featured.length]);

    if (featured.length === 0) return null;

    const current = featured[activeIndex];

    return (
        <section
            className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.06] shadow-2xl group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Image */}
            <div className="relative aspect-[16/10] sm:aspect-[2.4/1] w-full bg-black">
                {current.thumbnail && current.thumbnail !== "/placeholder.svg" ? (
                    <Image
                        src={current.thumbnail}
                        alt={current.title}
                        fill
                        sizes="100vw"
                        className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
                )}

                {/* Gradient Overlays for Cinematic Feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.4))]" />

                {/* Ambient Glow */}
                <div className="absolute bottom-0 left-0 w-[70%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.15),transparent_60%)] pointer-events-none mix-blend-screen" />
            </div>

            {/* Full-card link for mobile only (prevents HTML nested <a> tag validation errors on desktop) */}
            <Link
                href={`/watch/${current.id}`}
                className="absolute inset-0 z-20 sm:hidden cursor-pointer"
                aria-label={`Watch ${current.title}`}
            />

            {/* Content Overlay - Styled with compact text sizing on mobile and custom featured text override support */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-10 md:p-14 z-30 pointer-events-none">
                <div className="max-w-3xl transform transition-transform duration-700 ease-out translate-y-2 group-hover:translate-y-0">
                    {/* Category Badge */}
                    {((current.featuredCategory || current.category) && (current.featuredCategory || current.category) !== "All") && (
                        <span className="inline-block px-1.5 py-0.5 mb-1.5 sm:px-3 sm:py-1 sm:mb-4 text-[8px] sm:text-xs font-bold uppercase tracking-[0.2em] bg-amber-500/10 text-amber-400 rounded-sm border border-amber-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            {current.featuredCategory || current.category}
                        </span>
                    )}

                    {/* Title */}
                    <h2 className="text-sm sm:text-4xl md:text-5xl font-black text-white leading-[1.2] sm:leading-[1.1] tracking-tight mb-1 sm:mb-3 line-clamp-1 sm:line-clamp-2 drop-shadow-2xl">
                        {current.featuredTitle || current.title}
                    </h2>

                    {/* Channel Info */}
                    <p className="text-[10px] sm:text-sm md:text-base text-zinc-300 font-medium mb-3 sm:mb-8 flex items-center flex-wrap gap-x-2 sm:gap-x-3 gap-y-0.5 sm:gap-y-1 opacity-90">
                        <span className="text-white font-bold">{current.channelName}</span>
                    </p>

                    {/* CTA */}
                    <Link
                        href={`/watch/${current.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 sm:gap-2.5 sm:px-8 sm:py-3.5 bg-white text-black font-bold text-[11px] sm:text-sm rounded-full hover:bg-zinc-200 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)] sm:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] pointer-events-auto"
                    >
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-black" />
                        Watch Now
                    </Link>
                </div>
            </div>

            {/* Navigation Arrows Removed */}

            {/* Dot Indicators */}
            {featured.length > 1 && (
                <div className="absolute bottom-3 right-5 sm:bottom-5 sm:right-8 flex gap-1.5">
                    {featured.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === activeIndex
                                    ? "w-6 bg-amber-400"
                                    : "w-1.5 bg-white/30 hover:bg-white/50"
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
