"use client";

import { useMemo, useState, useEffect } from "react";
import { useVideo, type VideoProps } from "@/context/VideoContext";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ContentRail } from "@/components/home/ContentRail";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { VideoCard } from "@/components/video/VideoCard";
import { TrendingUp, History, Clapperboard, Music2, Mic, Globe, Clock } from "lucide-react";
import Link from "next/link";
import { useStateFilter } from "@/context/StateContext";

/* Trending filter pill sub-component */
function TrendingFilters({ active, onChange }: {
    active: string;
    onChange: (v: "Curated" | "Today" | "This Week" | "All Time") => void;
}) {
    const opts = ["Curated", "Today", "This Week", "All Time"] as const;
    return (
        <div className="flex gap-2 flex-wrap">
            {opts.map(o => (
                <button
                    key={o}
                    onClick={() => onChange(o)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                        active === o
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                >
                    {o}
                </button>
            ))}
        </div>
    );
}

/* ---------------- CATEGORY CONFIG ---------------- */

const CATEGORY_CONFIG = [
    { key: "History", label: "History & Heritage", icon: <Clapperboard className="w-4 h-4" />, accent: "amber" },
    { key: "Music", label: "Music & Performance", icon: <Music2 className="w-4 h-4" />, accent: "green" },
    { key: "Speeches", label: "Speeches & Voices", icon: <Mic className="w-4 h-4" />, accent: "red" },
    { key: "Parade", label: "Parades & Celebrations", icon: <Globe className="w-4 h-4" />, accent: "amber" },
] as const;

interface CategoryFeed {
    key: string;
    label: string;
    icon: React.ReactNode;
    accent: string;
    videos: VideoProps[];
}

/* ---------------- SAFE GLOBAL CACHE ---------------- */

type HomepageCache = {
    trending: VideoProps[];
    recent: VideoProps[];
    featured: VideoProps[];
    categoryFeeds: CategoryFeed[];
    totalArchives: number;
    stateCode?: string;
};

let globalHomepageCache: HomepageCache | null = null;

/* ---------------- SAFE VIEW PARSER (FIXED CORE BUG) ---------------- */

function parseViews(v: unknown): number {
    if (v == null) return 0;

    // normalize EVERYTHING safely
    const str = String(v).toUpperCase().replace(/,/g, "").trim();

    // handle formatted values
    const num = parseFloat(str);

    if (str.includes("M")) return num * 1_000_000;
    if (str.includes("K")) return num * 1_000;
    if (str.includes("B")) return num * 1_000_000_000;

    return Number.isFinite(num) ? num : 0;
}

/* ---------------- PAGE ---------------- */

export default function HomePage() {
    const { watchHistory } = useVideo();
    const { selectedState } = useStateFilter();
    const [now] = useState(() => Date.now());

    const [trendingFilter, setTrendingFilter] =
        useState<"Curated" | "Today" | "This Week" | "All Time">("Curated");

    const cached = globalHomepageCache;

    const [trendingVideos, setTrendingVideos] = useState<VideoProps[]>(cached?.trending || []);
    const [recentVideos, setRecentVideos] = useState<VideoProps[]>(cached?.recent || []);
    const [featuredVideos, setFeaturedVideos] = useState<VideoProps[]>(cached?.featured || []);
    const [categoryFeeds, setCategoryFeeds] = useState<CategoryFeed[]>(cached?.categoryFeeds || []);
    const [isFeedsLoading, setIsFeedsLoading] = useState(!cached);
    const [totalArchives, setTotalArchives] = useState(cached?.totalArchives || 0);

    const [selectedCategory, setSelectedCategory] = useState("All");

    const [categoryVideos, setCategoryVideos] = useState<VideoProps[]>([]);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    /* ---------------- FETCH HOMEPAGE ---------------- */

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                if (!cancelled) setIsFeedsLoading(true);

                const stateParam = selectedState?.code ? `&state=${selectedState.code}` : "";

                const [trendRes, recentRes, featuredRes] = await Promise.all([
                    fetch(`/api/videos/feed?feed=trending&limit=20${stateParam}`),
                    fetch(`/api/videos/feed?feed=recent&limit=20${stateParam}`),
                    fetch(`/api/videos/feed?feed=featured&limit=10${stateParam}`)
                ]);

                const trendData = await trendRes.json();
                const recentData = await recentRes.json();
                const featuredData = await featuredRes.json();

                const cats = await Promise.all(
                    CATEGORY_CONFIG.map(async (c) => {
                        const res = await fetch(`/api/videos/feed?category=${c.key}&limit=20${stateParam}`);
                        const data = await res.json();
                        return { ...c, videos: data.videos || [] };
                    })
                );

                if (cancelled) return;

                const payload = {
                    trending: trendData.videos || [],
                    recent: recentData.videos || [],
                    featured: featuredData.videos || [],
                    categoryFeeds: cats,
                    totalArchives: recentData.total || 0,
                    stateCode: selectedState?.code
                };

                globalHomepageCache = payload;

                setTrendingVideos(payload.trending);
                setRecentVideos(payload.recent);
                setFeaturedVideos(payload.featured);
                setCategoryFeeds(payload.categoryFeeds);
                setTotalArchives(payload.totalArchives);

            } finally {
                if (!cancelled) setIsFeedsLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [selectedState]);

    /* ---------------- CATEGORY LOAD ---------------- */

    useEffect(() => {
        if (selectedCategory === "All") return;

        let cancelled = false;

        async function loadCat() {
            setIsCategoryLoading(true);

            try {
                const res = await fetch(
                    `/api/videos/feed?category=${selectedCategory}&limit=40`
                );
                const data = await res.json();

                if (!cancelled) {
                    setCategoryVideos(data.videos || []);
                }
            } finally {
                if (!cancelled) setIsCategoryLoading(false);
            }
        }

        loadCat();
        return () => { cancelled = true; };
    }, [selectedCategory]);

    /* ---------------- TRENDING LOGIC (SAFE SORT) ---------------- */

    const filteredTrending = useMemo(() => {
        const videos = [...trendingVideos];

        if (trendingFilter === "Curated") {
            const curated = videos.filter(v => v.isTrending);
            const rest = videos
                .filter(v => !v.isTrending)
                .sort((a, b) => parseViews(b.views) - parseViews(a.views));

            return [...curated, ...rest].slice(0, 10);
        }

        let filtered = videos;

        if (trendingFilter === "Today") {
            filtered = filtered.filter(v => {
                if (!v.createdAt) return false;
                return now - new Date(v.createdAt).getTime() < 86400000;
            });
        }

        if (trendingFilter === "This Week") {
            filtered = filtered.filter(v => {
                if (!v.createdAt) return false;
                return now - new Date(v.createdAt).getTime() < 604800000;
            });
        }

        return filtered
            .sort((a, b) => parseViews(b.views) - parseViews(a.views))
            .slice(0, 10);
    }, [trendingVideos, trendingFilter, now]);

    const carouselVideos = featuredVideos.length
        ? featuredVideos
        : filteredTrending.slice(0, 5);

    const continueWatching = watchHistory.slice(0, 8);

    /* suppress unused variable lint */
    void totalArchives;
    void categoryVideos;
    void isCategoryLoading;

    /* ---------------- LOADING ---------------- */

    if (isFeedsLoading) {
        return (
            <main className="min-h-screen pb-20">
                {/* Hero skeleton */}
                <div className="w-full aspect-[16/10] sm:aspect-[2.5/1] rounded-2xl sm:rounded-[2rem] bg-white/[0.03] animate-pulse" />
                {/* Rail skeletons */}
                <div className="mt-8 space-y-8">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <div className="h-7 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
                            <div className="flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4].map(j => (
                                    <div key={j} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                                        <div className="aspect-video rounded-2xl bg-white/[0.04] animate-pulse" />
                                        <div className="mt-3 h-4 w-3/4 bg-white/[0.04] rounded animate-pulse" />
                                        <div className="mt-2 h-3 w-1/2 bg-white/[0.03] rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    /* ---------------- UI ---------------- */

    return (
        <main className="min-h-screen pb-20 selection:bg-amber-500/30 relative">
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_50%)]"></div>

            <div className="relative px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 space-y-12 sm:space-y-16 max-w-[1600px] mx-auto">
                <div className="animate-revealUp" style={{ animationDuration: "0.8s", animationFillMode: "both" }}>
                    <HeroCarousel videos={carouselVideos} />
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Category Filter Bar - below hero, NOT sticky */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 border-b border-white/5 scroll-smooth">
                    {["All", "History", "Music", "Speeches", "Parade", "Food", "2024", "SAREMBOK"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                                selectedCategory === cat
                                    ? "bg-j-gold text-black border-j-gold shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                                    : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {continueWatching.length > 0 && (
                    <>
                        <ContentRail
                            title="Continue Watching"
                            videos={continueWatching}
                            icon={<History />}
                            accentColor="green"
                        />
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />
                    </>
                )}

                <div className="animate-revealUp" style={{ animationDelay: "0.2s", animationDuration: "0.8s", animationFillMode: "both" }}>
                    <ContentRail
                        title="Trending Now"
                        videos={filteredTrending}
                        icon={<TrendingUp />}
                        accentColor="red"
                        seeAllHref="/browse"
                        headerControls={
                            <TrendingFilters
                                active={trendingFilter}
                                onChange={setTrendingFilter}
                            />
                        }
                    />
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                <div className="animate-revealUp" style={{ animationDelay: "0.4s", animationDuration: "0.8s", animationFillMode: "both" }}>
                    <ShortsShelf horizontal />
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {recentVideos.length > 0 && (
                    <>
                        <section className="space-y-6 animate-revealUp" style={{ animationDelay: "0.6s", animationDuration: "0.8s", animationFillMode: "both" }}>
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <Clock className="text-zinc-400 opacity-80 w-4 h-4" />
                                    <h2 className="text-xl sm:text-2xl font-black text-white border-l-4 border-amber-500 pl-3 tracking-tight">
                                        Recently Added
                                    </h2>
                                    <span className="text-xs text-zinc-500 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md">
                                        {recentVideos.length}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {recentVideos.map(v => (
                                    <VideoCard key={v.id} video={v} />
                                ))}
                            </div>
                        </section>
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />
                    </>
                )}

                {/* Category Feeds */}
                <div>
                    {categoryFeeds
                        .filter(cf => cf.videos.length > 0)
                        .map((cf, index, arr) => (
                            <div key={cf.key}>
                                <ContentRail
                                    title={cf.label}
                                    videos={cf.videos}
                                    icon={cf.icon}
                                    accentColor={cf.accent}
                                />
                                {index < arr.length - 1 && (
                                    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />
                                )}
                            </div>
                        ))
                    }
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                
                {/* â”€â”€ CULTUREQUEST PLAY SECTION â”€â”€ */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                <section
                    className="relative overflow-hidden rounded-3xl premium-card p-8 sm:p-12 group flex flex-col md:flex-row items-center justify-between gap-8 gloss-shine animate-revealUp"
                    style={{ animationDelay: "0.7s", animationDuration: "0.8s", animationFillMode: "both" }}
                >
                    <div className="gloss-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
                    <div className="relative z-10 max-w-xl text-center md:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            ðŸ§© Daily Puzzle
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase leading-tight mb-4">
                            CultureQuest
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 font-bold">Puzzle &amp; Play</span>
                        </h2>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6">
                            Match Juneteenth icons, earn CQ Points, unlock achievements, and climb the leaderboard. New puzzle drops every day.
                        </p>
                    </div>
                    <div className="relative z-10 shrink-0">
                        <Link
                            className="bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                            href="/play"
                        >
                            <span>Play Now</span>
                        </Link>
                    </div>
                </section>
<section 
                    className="relative overflow-hidden rounded-3xl premium-card p-8 sm:p-12 mt-8 group flex flex-col md:flex-row items-center justify-between gap-8 gloss-shine animate-revealUp" 
                    style={{ animationDelay: "0.8s", animationDuration: "0.8s", animationFillMode: "both" }}
                >
                    <div className="gloss-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-xl text-center md:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-j-gold text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                                <path d="M20 2v4"></path>
                                <path d="M22 4h-4"></path>
                                <circle cx="4" cy="20" r="2"></circle>
                            </svg>
                            Interactive Game
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase leading-tight mb-4">
                            Cookout &amp; Culture
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-emerald-500 font-bold">Trivia Showdown</span>
                        </h2>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6 group-hover:text-zinc-300 transition-colors duration-300 font-sans">
                            Prove your seat at the table! Test your knowledge on crucial Black History achievements and the unwritten laws of the cookout (remember: no raisins allowed in the potato salad!). Play with streak multipliers, unlock lifelines, and record your score.
                        </p>
                    </div>
                    
                    <div className="relative z-10 shrink-0">
                        <Link 
                            className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-red-500/15 hover:shadow-red-500/30 hover:scale-105 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2" 
                            href="/trivia"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 fill-white" aria-hidden="true">
                                <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
                            </svg>
                            Claim Your Plate
                        </Link>
                    </div>
                </section>

                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                <section 
                    className="relative overflow-hidden rounded-3xl premium-card p-8 sm:p-14 mt-8 mb-4 group gloss-shine animate-revealUp"
                    style={{ animationDelay: "1s", animationDuration: "0.8s", animationFillMode: "both" }}
                >
                    <div className="gloss-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_40%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_40%)]"></div>
                    
                    <div className="relative max-w-3xl z-10">
                        <p className="uppercase tracking-[0.4em] text-amber-500/90 font-bold text-[10px] sm:text-xs mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-amber-500/50"></span>
                            Black Cultural Infrastructure
                        </p>
                        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-white leading-none mb-4">
                            Culture
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 ml-1">Quest</span>
                        </h2>
                        <p className="text-zinc-400 text-sm sm:text-base font-medium leading-relaxed max-w-xl mb-8 group-hover:text-zinc-300 transition-colors duration-300">
                            AI-native streaming platform preserving and celebrating Black cultural heritage through community-driven media archives, documentaries, and live cultural programming.
                        </p>
                        <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 w-fit border border-white/10 backdrop-blur-md">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] sm:text-xs tracking-widest text-zinc-300 font-mono uppercase font-semibold">
                                {recentVideos.length} archives available
                            </span>
                        </div>
                    </div>

                    <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none"></div>
                    <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-amber-500/10 opacity-50 blur-[2px] group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full border border-amber-500/20 opacity-40 blur-[1px] group-hover:scale-110 transition-transform duration-700"></div>
                </section>
            </div>
        </main>
    );
}
