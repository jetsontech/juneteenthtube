"use client";

import { useState, useEffect } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { EPG, Channel } from "@/components/live/EPG";
import Link from "next/link";
import { ArrowLeft, Tv, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LiveTV() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [categories] = useState(["All", "Entertainment", "Movies", "News", "Music", "Kids", "Sports", "Local"]);
    const [activeCategory, setActiveCategory] = useState("All");

    useEffect(() => {
        async function fetchLiveTVData() {
            try {
                // Fetch active channels
                const { data: channelData, error: channelError } = await supabase
                    .from('channels')
                    .select('*')
                    .eq('status', 'active')
                    .order('order_index', { ascending: true });

                if (channelError) throw channelError;

                // Fetch programming data for the next 24 hours
                const now = new Date().toISOString();
                const tomorrow = new Date(Date.now() + 86400000).toISOString();

                const { data: epgData, error: epgError } = await supabase
                    .from('epg_data')
                    .select('*')
                    .gte('end_time', now)
                    .lte('start_time', tomorrow)
                    .order('start_time', { ascending: true });

                if (epgError) throw epgError;

                // If any EPG data contains video_ids, we need to fetch the actual video URLs
                let videosData: any[] = [];
                if (epgData) {
                    const videoIds = epgData.map(p => p.video_id).filter(id => id !== null);
                    if (videoIds.length > 0) {
                        const { data: vData } = await supabase
                            .from('videos')
                            .select('id, video_url')
                            .in('id', videoIds);
                        if (vData) videosData = vData;
                    }
                }

                // Map EPG data to channels
                if (channelData) {
                    const formattedChannels: Channel[] = channelData.map(c => {
                        const channelEpg = epgData ? epgData.filter(p => p.channel_id === c.id) : [];
                        let playlist: string[] | undefined = undefined;

                        // If it's an internal VOD channel, map the scheduled programs to their actual MP4 URLs
                        if (c.is_internal_vod && channelEpg.length > 0) {
                            playlist = channelEpg
                                .map(epg => {
                                    const video = videosData.find(v => v.id === epg.video_id);
                                    return video?.video_url;
                                })
                                .filter(Boolean) as string[];
                        }

                        return {
                            id: c.id,
                            name: c.name,
                            logo_url: c.logo_url,
                            stream_url: c.is_internal_vod && playlist && playlist.length > 0 ? playlist[0] : c.stream_url,
                            playlist: playlist,
                            is_internal_vod: c.is_internal_vod,
                            programs: channelEpg
                        };
                    });

                    setChannels(formattedChannels);
                    if (formattedChannels.length > 0) {
                        setCurrentChannel(formattedChannels[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load Live TV Guide:", err);
            }
        }

        fetchLiveTVData();

        // Refresh EPG data every 5 minutes
        const interval = setInterval(fetchLiveTVData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (!currentChannel) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin mb-4"></div>
                    <p className="text-white/50 text-sm animate-pulse tracking-widest uppercase">Initializing Broadcast...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-black text-white flex flex-col font-sans overflow-hidden items-stretch selection:bg-red-500/30">
            {/* Main Player Area - Responsive Height (Smaller on mobile, full flex on desktop) */}
            <main className="h-[35vh] md:h-auto md:flex-1 relative bg-black flex flex-col justify-center shrink-0">
                {/* Subtle Overlay Back Button */}
                <Link
                    href="/"
                    className="absolute top-6 left-6 z-30 flex items-center bg-black/40 hover:bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform text-white" />
                    <span className="text-sm font-bold text-white">Back</span>
                </Link>

                {/* Edge-to-Edge Player Context */}
                <div className="w-full h-full relative z-10 bg-black">
                    <LivePlayer streamUrl={currentChannel.stream_url} playlist={currentChannel.playlist} />

                    {/* Minimalist Live TV Badge */}
                    <div className="absolute top-6 right-6 z-20 flex items-center bg-red-600/90 backdrop-blur-md px-3 py-1.5 rounded-sm shadow-xl">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Live • {currentChannel.name}</span>
                    </div>
                </div>
            </main>

            {/* Premium EPG / TV Guide Section */}
            <div className="flex-1 z-20 relative bg-zinc-950 flex flex-col min-h-0">
                {/* Guide Toolbar */}
                <div className="h-14 bg-zinc-900 border-b border-black flex items-center px-6 shrink-0 relative z-30 shadow-lg">
                    {/* Category Filter Tabs */}
                    <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar flex-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Time indicator (Right aligned) */}
                    <div className="font-mono text-xs font-bold text-white/40 tracking-widest shrink-0 ml-6 hidden md:block uppercase bg-black/40 px-3 py-1.5 rounded">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} PST
                    </div>
                </div>

                {/* The Scrolling Grid */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                        <EPG
                            channels={channels}
                            currentChannelId={currentChannel.id}
                            onChannelSelect={(c) => setCurrentChannel(c)}
                            categories={categories}
                            activeCategory={activeCategory}
                            onCategorySelect={setActiveCategory}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
