"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { type VideoProps } from "@/context/VideoContext";
import { supabase } from "@/lib/supabase";
import { getDisplayViews } from "@/lib/viewHelpers";
import { VideoCard } from "@/components/video/VideoCard";
import { Search, Compass, TrendingUp, Music2, Clapperboard, UtensilsCrossed, Mic, Calendar, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useStateFilter } from "@/context/StateContext";
import { useInView } from "react-intersection-observer";

const EXPLORE_CATEGORIES = [
    { key: "All", label: "All", icon: Globe },
    { key: "History", label: "History", icon: Clapperboard },
    { key: "Music", label: "Music", icon: Music2 },
    { key: "Speeches", label: "Speeches", icon: Mic },
    { key: "Parade", label: "Parades", icon: TrendingUp },
    { key: "Food", label: "Food", icon: UtensilsCrossed },
    { key: "2024", label: "2024", icon: Calendar },
    { key: "SAREMBOK", label: "SAREMBOK", icon: Compass },
] as const;

function ChannelCard({ name, videoCount, avatar }: { name: string; videoCount: number; avatar: string }) {
    return (
        <Link href={`/channel/${encodeURIComponent(name)}`}
            className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
        >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-j-green to-j-gold overflow-hidden ring-2 ring-white/10 group-hover:ring-j-gold/50 transition-all">
                {avatar ? (
                    <Image src={avatar} alt={name} width={64} height={64} className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl">
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="text-center min-w-0 w-full">
                <p className="text-white font-semibold text-sm truncate">{name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{videoCount} video{videoCount !== 1 ? 's' : ''}</p>
            </div>
        </Link>
    );
}

interface DBVideo {
    id: string;
    title: string;
    thumbnail_url?: string;
    views?: number | string;
    created_at: string;
    duration?: string;
    video_url: string;
    category?: string;
    state?: string;
    channel_name?: string;
    channel_avatar?: string;
    posted_at?: string;
    video_url_h264?: string;
    transcode_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    owner_id?: string;
    is_featured?: boolean;
    is_trending?: boolean;
}

export default function ExplorePage() {
    const { selectedState } = useStateFilter();
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Server-side video state with Infinite Scroll variables
    const [dbVideos, setDbVideos] = useState<VideoProps[]>([]);
    const [isSearchingDb, setIsSearchingDb] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Real-time trending videos feed from DB view
    const [trendingVideos, setTrendingVideos] = useState<VideoProps[]>([]);

    useEffect(() => {
        let isCancelled = false;
        async function fetchTrending() {
            try {
                const stateParam = selectedState?.code ? `&state=${selectedState.code}` : "";
                const res = await fetch(`/api/videos/feed?feed=trending&limit=6${stateParam}`);
                const data = await res.json();
                if (!isCancelled) {
                    setTrendingVideos(data.videos || []);
                }
            } catch (e) {
                console.error("Failed to fetch trending videos on explore page:", e);
            }
        }
        fetchTrending();
        return () => {
            isCancelled = true;
        };
    }, [selectedState]);

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
    });

    const fetchVideos = useCallback(async (currentOffset: number, append = false) => {
        if (currentOffset === 0) {
            setIsSearchingDb(true);
        } else {
            setIsMoreLoading(true);
        }
        
        try {
            const limit = 20;
            let query = supabase
                .from('videos')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + limit - 1);

            if (selectedState && selectedState.code !== "GLOBAL") {
                query = query.or(`state.eq.${selectedState.code},state.eq.GLOBAL`);
            }
            if (selectedCategory !== "All") {
                query = query.eq('category', selectedCategory);
            }

            // Server-side text matching
            if (searchQuery.trim()) {
                query = query.ilike('title', `%${searchQuery}%`);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            // Map results just like VideoContext
            const mapped: VideoProps[] = ((data as unknown as DBVideo[]) || []).map((video: DBVideo) => {
                const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
                
                let h264Url = video.video_url_h264;
                if (h264Url && !h264Url.startsWith('http')) {
                    h264Url = `${s3Domain}/${h264Url}`;
                }

                let videoUrl = video.video_url;
                if (videoUrl && !videoUrl.startsWith('http')) {
                    if (videoUrl.startsWith('pub-efcc4aa0b3b24e3d97760577b0ec20bd/')) {
                        videoUrl = `${s3Domain}/${videoUrl.substring('pub-efcc4aa0b3b24e3d97760577b0ec20bd/'.length)}`;
                    } else {
                        videoUrl = `${s3Domain}/${videoUrl}`;
                    }
                }

                let thumbnail = video.thumbnail_url || "";
                if (thumbnail) {
                    if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                        thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
                    }
                    if (thumbnail.includes('media.juneteenthtube.com')) {
                        thumbnail = thumbnail.replace('media.juneteenthtube.com', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                    }
                }

                return {
                    id: video.id,
                    title: video.title,
                    thumbnail: thumbnail,
                    channelName: video.channel_name || (video.category === 'Food' ? 'ATL Foodie' : 'JuneteenthTV'),
                    channelAvatar: video.channel_avatar || "",
                    views: getDisplayViews(video.id, Number(video.views) || 0).toString(),
                    postedAt: video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently",
                    duration: video.duration || "5:00",
                    videoUrl: videoUrl,
                    category: video.category || "All",
                    createdAt: video.created_at,
                    state: video.state || "GLOBAL",
                    videoUrlH264: h264Url,
                    transcodeStatus: video.transcode_status,
                    ownerId: video.owner_id,
                    isFeatured: video.is_featured || false,
                    isTrending: video.is_trending || false
                };
            });

            setDbVideos(prev => append ? [...prev, ...mapped] : mapped);
            setHasMore((currentOffset + mapped.length) < (count || 0));
        } catch (err) {
            console.error("Explore Search Error:", err);
        } finally {
            setIsSearchingDb(false);
            setIsMoreLoading(false);
        }
    }, [selectedCategory, searchQuery, selectedState]);

    // Handle initial load / filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVideos(0, false);
        }, searchQuery.trim() ? 300 : 0);

        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery, selectedState, fetchVideos]);

    // Handle Infinite Scroll triggers
    useEffect(() => {
        if (inView && hasMore && !isSearchingDb && !isMoreLoading) {
            const newOffset = dbVideos.length;
            const timer = setTimeout(() => {
                fetchVideos(newOffset, true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [inView, hasMore, isSearchingDb, isMoreLoading, dbVideos.length, fetchVideos]);

    // trendingVideos is now state-driven, fetched from the backend trending engine API view

    // Unique channels with video counts
    const channels = useMemo(() => {
        const map = new Map<string, { name: string; videoCount: number; avatar: string }>();
        dbVideos.forEach(v => {
            if (!map.has(v.channelName)) {
                map.set(v.channelName, { name: v.channelName, videoCount: 0, avatar: v.channelAvatar || "" });
            }
            map.get(v.channelName)!.videoCount++;
        });
        return Array.from(map.values()).sort((a, b) => b.videoCount - a.videoCount);
    }, [dbVideos]);

    const isSearching = searchQuery.trim().length > 0;
    const isFiltering = selectedCategory !== "All" || isSearching;

    return (
        <main className="pb-12">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3 mb-4">
                    <Compass className="w-6 h-6 text-j-gold" />
                    <h1 className="text-2xl font-bold text-white">{"Explore"}</h1>
                </div>

                {/* Search */}
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search videos, channels, topics…"
                        className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-j-gold/50 focus:bg-white/10 transition-all text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Category Pills */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                {EXPLORE_CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    const active = selectedCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => setSelectedCategory(cat.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                                active
                                    ? "bg-j-gold text-black"
                                    : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-10">

                {/* Search / Filter Results */}
                {isFiltering ? (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-lg font-bold text-white">
                                {isSearching ? `Results for "${searchQuery}"` : selectedCategory}
                            </h2>
                            <span className="text-gray-500 text-sm">({dbVideos.length} videos)</span>
                        </div>
                        {isSearchingDb ? (
                            <div className="py-16 text-center bg-white/[0.03] rounded-2xl border border-white/5">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-j-gold mx-auto mb-4"></div>
                                <p className="text-gray-400">{"Searching archive..."}</p>
                            </div>
                        ) : dbVideos.length === 0 ? (
                            <div className="py-16 text-center bg-white/[0.03] rounded-2xl border border-white/5">
                                <p className="text-gray-400">{"No videos found."}</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                                    className="mt-4 text-j-gold text-sm hover:underline"
                                >
                                    {"Clear filters"}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {dbVideos.map(v => <VideoCard key={v.id} video={v} />)}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Trending Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-j-red" />
                                <h2 className="text-lg font-bold text-white">{"Trending Now"}</h2>
                            </div>
                            {isSearchingDb ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                                    {[1, 2, 3].map((n) => (
                                        <div key={n} className="aspect-video bg-white/5 rounded-2xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trendingVideos.map((v) => (
                                        <VideoCard key={v.id} video={v} />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Channels Section */}
                        {channels.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-white mb-4">{"Browse Channels"}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {channels.slice(0, 12).map(ch => (
                                        <ChannelCard key={ch.name} name={ch.name} videoCount={ch.videoCount} avatar={ch.avatar} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* By Category Sections */}
                        {EXPLORE_CATEGORIES.filter(c => c.key !== "All").map(cat => {
                            const catVideos = dbVideos.filter(v => v.category === cat.key);
                            if (catVideos.length === 0) return null;
                            const Icon = cat.icon;
                            return (
                                <section key={cat.key}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-5 h-5 text-j-gold" />
                                            <h2 className="text-lg font-bold text-white">{cat.label}</h2>
                                            <span className="text-gray-500 text-sm">({catVideos.length})</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCategory(cat.key)}
                                            className="text-sm text-j-gold hover:underline font-medium"
                                        >
                                            {"See all"}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {catVideos.slice(0, 4).map(v => <VideoCard key={v.id} video={v} />)}
                                    </div>
                                </section>
                            );
                        })}
                    </>
                )}

                {/* Infinite Scroll Sentinel */}
                {hasMore && !isSearchingDb && (
                    <div ref={loadMoreRef} className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-j-gold"></div>
                    </div>
                )}
            </div>
        </main>
    );
}
