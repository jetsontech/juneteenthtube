"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VideoProps } from "@/context/VideoContext";

// Simple localization dictionary & helper to resolve internationalization warnings
const translations = new Map<string, string>([
    ["seeAll", "See all"],
    ["noVideosFound", "No videos found for this filter."],
    ["noThumbnail", "No Thumbnail"]
]);

const t = (key: string) => {
    return translations.get(key) || key;
};


interface ContentRailProps {
    title: string;
    videos: VideoProps[];
    icon?: React.ReactNode;
    accentColor?: string;
    maxItems?: number;
    seeAllHref?: string;
    headerControls?: React.ReactNode;
}

export function ContentRail({
    title,
    videos,
    icon,
    accentColor = "amber",
    maxItems = 12,
    seeAllHref,
    headerControls,
}: ContentRailProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [videos]);

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.75;
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    if (videos.length === 0 && !headerControls) return null;

    const items = videos.slice(0, maxItems);
    const accentBorder = accentColor === "red" ? "border-red-500" : accentColor === "green" ? "border-emerald-500" : "border-amber-500";

    return (
        <section className="relative group/rail">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3 shrink-0">
                        {icon && <span className="text-zinc-400 opacity-80">{icon}</span>}
                        <h2 className={`text-xl sm:text-2xl font-black text-white border-l-4 ${accentBorder} pl-3 tracking-tight`}>
                            {title}
                        </h2>
                        <span className="text-xs text-zinc-500 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md">
                            {videos.length}
                        </span>
                    </div>
                    {headerControls && (
                        <div className="ml-0 sm:ml-4 flex-1 min-w-0">
                            {headerControls}
                        </div>
                    )}
                </div>
                {seeAllHref && (
                    <Link
                        href={seeAllHref}
                        className="text-sm text-zinc-400 hover:text-white font-semibold transition-colors duration-300 flex items-center gap-1 group/link shrink-0 ml-4"
                    >
                        {t("seeAll")} <span className="group-hover/link:translate-x-1 transition-transform duration-300">→</span>
                    </Link>
                )}
            </div>

            {/* Scrollable Container */}
            <div className="relative">

                <div
                    ref={scrollRef}
                    className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pt-6 -mt-6 px-2 -mx-2 pb-6 snap-x snap-mandatory"
                >
                    {items.length === 0 ? (
                        <div className="w-full py-12 flex items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
                            <p className="text-zinc-500 font-medium text-sm">{t("noVideosFound")}</p>
                        </div>
                    ) : items.map((video) => (
                        <Link
                            key={video.id}
                            href={`/watch/${video.id}`}
                            className="group flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] block snap-start transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden premium-card border border-white/5 hover:border-j-gold/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] group-hover:shadow-[0_20px_50px_rgba(212,175,55,0.15)] transition-all duration-500">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 z-10" />
                                <div className="gloss-overlay" />
                                {video.thumbnail && video.thumbnail !== "/placeholder.svg" ? (
                                    <Image
                                        src={video.thumbnail}
                                        alt={video.title}
                                        fill
                                        sizes="340px"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                                        <span className="text-zinc-600 text-xs font-medium">{t("noThumbnail")}</span>
                                    </div>
                                )}

                                {/* Duration Badge */}
                                {video.duration && video.duration !== "0:00" && (
                                    <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 text-[10px] text-white font-bold tracking-wide">
                                        {video.duration}
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-white/[0.02] transition-colors duration-300 pointer-events-none" />
                            </div>

                            {/* Info */}
                            <div className="mt-2.5 px-0.5">
                                <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors duration-200">
                                    {video.title}
                                </h3>
                                <p className="mt-1 text-[11px] text-zinc-400 font-medium truncate">
                                    {video.channelName}
                                </p>
                                <p className="text-[11px] text-zinc-500 truncate">
                                    {video.views} views • {video.postedAt}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
