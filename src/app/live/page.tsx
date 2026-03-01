"use client";

import { useState, useEffect } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { EPG, Channel, Program } from "@/components/live/EPG";
import Link from "next/link";
import { ArrowLeft, Maximize2 } from "lucide-react";
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

                if (channelData) {
                    const formattedChannels: Channel[] = channelData.map(c => {
                        const channelEpg = epgData ? epgData.filter(p => p.channel_id === c.id) : [];
                        let playlist: string[] | undefined = undefined;

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
                            description: c.description,
                            logo_url: c.logo_url,
                            stream_url: c.is_internal_vod && playlist && playlist.length > 0 ? playlist[0] : c.stream_url,
                            playlist: playlist,
                            is_internal_vod: c.is_internal_vod,
                            programs: channelEpg
                        };
                    });

                    setChannels(formattedChannels);
                    if (formattedChannels.length > 0) {
                        setCurrentChannel(prev => {
                            if (prev) {
                                const updatedCurrent = formattedChannels.find(c => c.id === prev.id);
                                return updatedCurrent || formattedChannels[0];
                            }
                            return formattedChannels[0];
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load Live TV Guide:", err);
            }
        }

        fetchLiveTVData();
        const interval = setInterval(fetchLiveTVData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Helper to get currently active program for the banner
    const getCurrentProgram = (channel: Channel | null): Program | undefined => {
        if (!channel || !channel.programs) return undefined;
        const now = Date.now();
        return channel.programs.find(p => {
            const start = new Date(p.start_time).getTime();
            const end = new Date(p.end_time).getTime();
            return now >= start && now <= end;
        });
    };

    if (!currentChannel) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-white animate-spin mb-6"></div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Samsung TV Plus</p>
                </div>
            </div>
        );
    }

    const currentProgram = getCurrentProgram(currentChannel);

    return (
        <div className="h-[100dvh] w-full bg-[#050505] text-white flex flex-col font-sans overflow-hidden selection:bg-white/20">

            {/* Absolute Top Navigation Overlay */}
            <div className="absolute top-0 left-0 right-0 h-24 z-30 pointer-events-none bg-gradient-to-b from-black/80 to-transparent flex">
                <div className="px-6 py-6 pointer-events-auto w-full flex justify-between items-start">
                    <Link
                        href="/"
                        className="flex items-center bg-black/40 hover:bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/5 transition-all group shadow-2xl"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform text-white/90" />
                        <span className="text-sm font-bold text-white/90 tracking-wide">Exit TV</span>
                    </Link>

                    {/* Samsung Style Channel Identifier Pill */}
                    <div className="flex items-center justify-end pointer-events-auto group cursor-pointer transition-transform hover:scale-105">
                        <div className="flex items-center bg-black/50 backdrop-blur-xl px-2 py-1.5 rounded-l-full border border-r-0 border-white/10 shadow-2xl pr-3">
                            {currentChannel.logo_url ? (
                                <img src={currentChannel.logo_url} alt={currentChannel.name} className="w-7 h-7 rounded-full mr-2 object-cover border border-white/20" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center mr-2 text-[10px] font-bold">
                                    {currentChannel.name.charAt(0)}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest leading-none mb-0.5">Watching</span>
                                <span className="text-xs font-bold text-white leading-none tracking-wide">{currentChannel.name}</span>
                            </div>
                        </div>
                        <div className="bg-white text-black font-black uppercase tracking-widest text-[10px] px-3 py-1.5 h-full rounded-r-full flex items-center justify-center border border-white border-l-0">
                            Live
                        </div>
                    </div>
                </div>
            </div>

            {/* Cinematic Player Area */}
            <main className="shrink-0 flex flex-col justify-start bg-zinc-950 w-full">
                <div className="w-full relative z-10 bg-black" style={{ height: "45vh", minHeight: "250px", maxHeight: "55vh" }}>
                    <LivePlayer streamUrl={currentChannel.stream_url} playlist={currentChannel.playlist} />
                </div>

                {/* Information Banner (Moved below player to avoid overlapping video) */}
                <div className="w-full bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-white/5 px-6 md:px-8 py-5 flex items-start justify-between shadow-inner z-20">
                    <div className="flex flex-col max-w-4xl">
                        <h1 className="text-xl md:text-3xl font-black text-white tracking-tight leading-none mb-1.5">
                            {currentProgram ? currentProgram.title : currentChannel.name}
                        </h1>
                        {currentProgram && (
                            <div className="text-red-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 font-mono flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                {new Date(currentProgram.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(currentProgram.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}
                        <p className="text-white/60 text-xs md:text-sm font-medium line-clamp-2 mt-1">
                            {currentProgram ? currentProgram.description : currentChannel.description}
                        </p>
                    </div>
                </div>
            </main>

            {/* Categories Bar */}
            <div className="h-12 bg-zinc-950 flex items-center px-4 md:px-8 shrink-0 relative z-30 border-b border-white/10 overflow-hidden shrink-0">
                <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar flex-1 pb-2 pt-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeCategory === cat
                                ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dynamic Guide Wrapper */}
            <div className="flex-1 overflow-hidden relative bg-zinc-950">
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
    );
}
