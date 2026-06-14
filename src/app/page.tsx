"use client";

import { useMemo, useState, useEffect, startTransition } from "react";
import { useVideo, type VideoProps } from "@/context/VideoContext";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ContentRail } from "@/components/home/ContentRail";
import { ShortsShelf } from "@/components/video/ShortsShelf";
import { VideoCard } from "@/components/video/VideoCard";
import { TrendingUp, Clock, History, Clapperboard, Music2, Mic, Globe, Sparkles, Play } from "lucide-react";
import Link from "next/link";
import { useStateFilter } from "@/context/StateContext";

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

let globalHomepageCache: {
    trending: VideoProps[];
    recent: VideoProps[];
    featured: VideoProps[];
    categoryFeeds: CategoryFeed[];
    totalArchives: number;
    stateCode: string | undefined;
} | null = null;

let globalCategoryCache: Record<string, { videos: VideoProps[]; stateCode: string | undefined }> = {};

export default function HomePage() {
    const { watchHistory } = useVideo();
    const { selectedState } = useStateFilter();

    type TrendingFilter = 'Curated' | 'Today' | 'This Week' | 'All Time';
    const [trendingFilter, setTrendingFilter] = useState<TrendingFilter>('Curated');

    // Ignore stateCode strict matching for initial hydration so we don't flash the skeleton
    // because selectedState is always undefined on the very first client render.
    const cached = globalHomepageCache;

    // State-driven paginated feeds
    const [trendingVideos, setTrendingVideos] = useState<VideoProps[]>(cached?.trending || []);
    const [recentVideos, setRecentVideos] = useState<VideoProps[]>(cached?.recent || []);
    const [featuredVideos, setFeaturedVideos] = useState<VideoProps[]>(cached?.featured || []);
    const [categoryFeeds, setCategoryFeeds] = useState<CategoryFeed[]>(cached?.categoryFeeds || []);
    const [isFeedsLoading, setIsFeedsLoading] = useState(!cached);
    const [totalArchives, setTotalArchives] = useState(cached?.totalArchives || 48);

    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    
    // Ignore strict state match on first render for category cache too
    const catCached = globalCategoryCache[selectedCategory]
        ? globalCategoryCache[selectedCategory].videos 
        : null;

    const [categoryVideos, setCategoryVideos] = useState<VideoProps[]>(catCached || []);
    const [isCategoryLoading, setIsCategoryLoading] = useState(false);

    // Fetch category specific videos when category filter is selected
    useEffect(() => {
        if (selectedCategory === "All") return;
        let isCancelled = false;
        async function fetchCategoryVideos() {
            if (globalCategoryCache[selectedCategory] && globalCategoryCache[selectedCategory].stateCode === selectedState?.code) {
                if (!isCancelled) {
                    setIsCategoryLoading(false);
                    setCategoryVideos(globalCategoryCache[selectedCategory].videos);
                }
                return;
            }
            setIsCategoryLoading(true);
            try {
                const stateParam = selectedState?.code ? `&state=${selectedState.code}` : "";
                const res = await fetch(`/api/videos/feed?category=${selectedCategory}&limit=40${stateParam}`);
                const data = await res.json();
                if (!isCancelled) {
                    setCategoryVideos(data.videos || []);
                    globalCategoryCache[selectedCategory] = { videos: data.videos || [], stateCode: selectedState?.code };
                }
            } catch (e) {
                console.error("Failed to load category videos:", e);
            } finally {
                if (!isCancelled) setIsCategoryLoading(false);
            }
        }
        fetchCategoryVideos();
        return () => {
            isCancelled = true;
        };
    }, [selectedCategory, selectedState]);

    useEffect(() => {
        let isCancelled = false;
        async function fetchHomepageFeeds() {
            if (globalHomepageCache && globalHomepageCache.stateCode === selectedState?.code) {
                if (!isCancelled) {
                    setIsFeedsLoading(false);
                    setTrendingVideos(globalHomepageCache.trending);
                    setRecentVideos(globalHomepageCache.recent);
                    setFeaturedVideos(globalHomepageCache.featured);
                    setCategoryFeeds(globalHomepageCache.categoryFeeds);
                    setTotalArchives(globalHomepageCache.totalArchives);
                }
                return;
            }
            setIsFeedsLoading(true);
            try {
                const stateParam = selectedState?.code ? `&state=${selectedState.code}` : "";

                // 1. Fetch Trending Feed (limit 20)
                const trendRes = await fetch(`/api/videos/feed?feed=trending&limit=20${stateParam}`);
                const trendData = await trendRes.json();
                
                // 2. Fetch Recent Feed (limit 20)
                const recentRes = await fetch(`/api/videos/feed?feed=recent&limit=20${stateParam}`);
                const recentData = await recentRes.json();

                // 3. Fetch Featured Feed (limit 10)
                const featuredRes = await fetch(`/api/videos/feed?feed=featured&limit=10${stateParam}`);
                const featuredData = await featuredRes.json();

                // 3. Fetch Category Rails (limit 20)
                const catPromises = CATEGORY_CONFIG.map(async (cat) => {
                    const res = await fetch(`/api/videos/feed?category=${cat.key}&limit=20${stateParam}`);
                    const data = await res.json();
                    return {
                        ...cat,
                        videos: data.videos || []
                    };
                });
                const resolvedCats = await Promise.all(catPromises);

                if (!isCancelled) {
                    const resolvedCatFeeds = resolvedCats.filter(cat => cat.videos.length > 0);
                    const total = recentData.total || trendData.total || 48;
                    setTrendingVideos(trendData.videos || []);
                    setRecentVideos(recentData.videos || []);
                    setFeaturedVideos(featuredData.videos || []);
                    setCategoryFeeds(resolvedCatFeeds);
                    setTotalArchives(total);
                    
                    globalHomepageCache = {
                        trending: trendData.videos || [],
                        recent: recentData.videos || [],
                        featured: featuredData.videos || [],
                        categoryFeeds: resolvedCatFeeds,
                        totalArchives: total,
                        stateCode: selectedState?.code
                    };
                }
            } catch (e) {
                console.error("Failed to load homepage feeds:", e);
            } finally {
                if (!isCancelled) setIsFeedsLoading(false);
            }
        }
        fetchHomepageFeeds();
        return () => {
            isCancelled = true;
        };
    }, [selectedState]);

    // Derived trending with filters applied locally on the 20 trending items
    const filteredTrending = useMemo(() => {
        const parseViews = (v: string) => {
            const cleaned = v.replace(/,/g, "");
            const num = parseFloat(cleaned);
            if (cleaned.includes("M")) return num * 1_000_000;
            if (cleaned.includes("K")) return num * 1_000;
            return num || 0;
        };

        if (trendingFilter === 'Curated') {
            const curated = trendingVideos.filter(v => v.isTrending);
            const curatedIds = new Set(curated.map(v => v.id));
            const topViewed = [...trendingVideos]
                .filter(v => !curatedIds.has(v.id))
                .sort((a, b) => parseViews(b.views) - parseViews(a.views));
            return [...curated, ...topViewed].slice(0, 10);
        }

        let filtered = [...trendingVideos];
        const now = new Date().getTime();

        if (trendingFilter === 'Today') {
            filtered = filtered.filter(v => {
                if (!v.createdAt) return false;
                const date = new Date(v.createdAt).getTime();
                return (now - date) <= 24 * 60 * 60 * 1000;
            });
        } else if (trendingFilter === 'This Week') {
            filtered = filtered.filter(v => {
                if (!v.createdAt) return false;
                const date = new Date(v.createdAt).getTime();
                return (now - date) <= 7 * 24 * 60 * 60 * 1000;
            });
        }

        const sorted = filtered.sort((a, b) => parseViews(b.views) - parseViews(a.views));
        if (sorted.length === 0 && trendingFilter !== 'All Time') {
            return [...trendingVideos].sort((a, b) => parseViews(b.views) - parseViews(a.views)).slice(0, 10);
        }
        return sorted.slice(0, 10);
    }, [trendingVideos, trendingFilter]);

    const carouselVideos = useMemo(() => {
        if (featuredVideos.length === 0) return filteredTrending.slice(0, 5);
        return featuredVideos;
    }, [featuredVideos, filteredTrending]);

    const continueWatching = useMemo(() => {
        return watchHistory.slice(0, 8);
    }, [watchHistory]);

    // Loading state
    if (isFeedsLoading) {
        return (
            <main className="min-h-screen pb-16 bg-[#0a0a0a] relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-20 selection:bg-amber-500/30 relative">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_50%)]" />

            <div className="relative px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 space-y-12 sm:space-y-16 max-w-[1600px] mx-auto">
                {/* Hero Carousel — Featured or Top 5 by views */}
                <div className="animate-revealUp" style={{ animationDuration: '0.8s', animationFillMode: 'both' }}>
                    <HeroCarousel videos={carouselVideos} />
                </div>

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Category Pills Bar */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 border-b border-white/5 scroll-smooth">
                    {["All", "History", "Music", "Speeches", "Parade", "Food", "2024", "SAREMBOK"].map(cat => {
                        const active = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => startTransition(() => setSelectedCategory(cat))}
                                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                                    active
                                        ? "bg-j-gold text-black border-j-gold shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                                        : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {selectedCategory !== "All" ? (
                    <section className="space-y-6 pt-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl font-black text-white border-l-4 border-amber-500 pl-3 tracking-tight">
                                    {selectedCategory}
                                </h2>
                                <span className="text-xs text-zinc-500 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md">
                                    {categoryVideos.length}
                                </span>
                            </div>
                        </div>

                        {isCategoryLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="aspect-video bg-white/5 rounded-2xl" />
                                ))}
                            </div>
                        ) : categoryVideos.length === 0 ? (
                            <div className="w-full py-24 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                                <p className="text-zinc-500 font-medium text-sm">No videos found in this category.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {categoryVideos.map((video) => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Continue Watching — from localStorage history */}
                {continueWatching.length > 0 && (
                    <>
                        <ContentRail
                            title="Continue Watching"
                            videos={continueWatching}
                            icon={<History className="w-4 h-4" />}
                            accentColor="green"
                        />
                        {/* Premium Gold-Fading Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />
                    </>
                )}

                {/* Trending */}
                <div className="animate-revealUp" style={{ animationDelay: '0.2s', animationDuration: '0.8s', animationFillMode: 'both' }}>
                    <ContentRail
                        title="Trending Now"
                        videos={filteredTrending}
                        icon={<TrendingUp className="w-4 h-4" />}
                        accentColor="red"
                        seeAllHref="/explore"
                        headerControls={
                            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                                {(['Curated', 'Today', 'This Week', 'All Time'] as TrendingFilter[]).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => startTransition(() => setTrendingFilter(filter))}
                                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                            trendingFilter === filter
                                                ? "bg-j-red/10 text-j-red border-j-red/30 shadow-[0_0_10px_rgba(229,9,20,0.1)]"
                                                : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        }
                    />
                </div>

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Shorts Shelf */}
                <div className="animate-revealUp" style={{ animationDelay: '0.4s', animationDuration: '0.8s', animationFillMode: 'both' }}>
                    <ShortsShelf horizontal={true} />
                </div>

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Recently Added — Premium Responsive Grid layout */}
                <section className="space-y-6 animate-revealUp" style={{ animationDelay: '0.6s', animationDuration: '0.8s', animationFillMode: 'both' }}>
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
                    
                    {recentVideos.length === 0 ? (
                        <div className="w-full py-12 flex items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
                            <p className="text-zinc-500 font-medium text-sm">No recently added videos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {recentVideos.slice(0, 8).map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                        {/* Category Sections */}
                        {categoryFeeds.map((cat, idx) => (
                            <div key={cat.key}>
                                <ContentRail
                                    title={cat.label}
                                    videos={cat.videos}
                                    icon={cat.icon}
                                    accentColor={cat.accent}
                                    seeAllHref={`/explore?category=${cat.key}`}
                                />
                                {idx < categoryFeeds.length - 1 && (
                                    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-12 opacity-60" />
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Trivia Game Promo Card */}
                <section className="relative overflow-hidden rounded-3xl premium-card p-8 sm:p-12 mt-8 group flex flex-col md:flex-row items-center justify-between gap-8 gloss-shine animate-revealUp" style={{ animationDelay: '0.8s', animationDuration: '0.8s', animationFillMode: 'both' }}>
                    <div className="gloss-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.06),transparent_40%)] pointer-events-none" />

                    <div className="relative z-10 max-w-xl text-center md:text-left">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-j-gold text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            Interactive Game
                        </span>
                        
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase leading-tight mb-4">
                            Cookout & Culture 
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-emerald-500 font-bold">
                                Trivia Showdown
                            </span>
                        </h2>
                        
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-6 group-hover:text-zinc-300 transition-colors duration-300 font-sans">
                            Prove your seat at the table! Test your knowledge on crucial Black History achievements and the unwritten laws of the cookout (remember: no raisins allowed in the potato salad!). Play with streak multipliers, unlock lifelines, and record your score.
                        </p>
                    </div>

                    <div className="relative z-10 shrink-0">
                        <Link
                            href="/trivia"
                            className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black px-10 py-5 rounded-2xl shadow-xl shadow-red-500/15 hover:shadow-red-500/30 hover:scale-105 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4 fill-white" />
                            Claim Your Plate
                        </Link>
                    </div>
                </section>

                {/* Premium Gold-Fading Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent my-4 opacity-80" />

                {/* Platform Identity Footer Card */}
                <section className="relative overflow-hidden rounded-3xl premium-card p-8 sm:p-14 mt-8 mb-4 group gloss-shine animate-revealUp" style={{ animationDelay: '1s', animationDuration: '0.8s', animationFillMode: 'both' }}>
                    <div className="gloss-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-emerald-500/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_40%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_40%)]" />

                    <div className="relative max-w-3xl z-10">
                        <p className="uppercase tracking-[0.4em] text-amber-500/90 font-bold text-[10px] sm:text-xs mb-4 flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-amber-500/50" />
                            Black Cultural Infrastructure
                        </p>

                        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-white leading-none mb-4">
                            Culture
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 ml-1">
                                Quest
                            </span>
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
                                {totalArchives} archives available
                            </span>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
                    <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-amber-500/10 opacity-50 blur-[2px] group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full border border-amber-500/20 opacity-40 blur-[1px] group-hover:scale-110 transition-transform duration-700" />
                </section>
            </div>
        </main>
    );
}

