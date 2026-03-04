"use client";

import { useState, useEffect, useRef } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { Channel, Program } from "@/components/live/EPG";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LiveTV() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const categories = ["All", "Entertainment", "Movies", "News", "Music", "Kids", "Sports"];

    useEffect(() => {
        async function fetchLiveTVData() {
            try {
                const { data: channelData, error: channelError } = await supabase
                    .from('channels')
                    .select('*')
                    .eq('status', 'active')
                    .order('order_index', { ascending: true });

                if (channelError) throw channelError;

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
                            .select('id, video_url, video_url_h264')
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
                                    if (!video) return null;
                                    let h264Url = video.video_url_h264;
                                    if (h264Url && !h264Url.startsWith('http')) {
                                        h264Url = `https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/${h264Url}`;
                                    }
                                    return h264Url || video.video_url;
                                })
                                .filter(Boolean) as string[];
                        }

                        return {
                            id: c.id,
                            name: c.name,
                            description: c.description,
                            logo_url: c.logo_url,
                            category: c.category || 'Entertainment',
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
            <div className="min-h-screen bg-[#141414] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-red-600 animate-spin mb-6"></div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Loading Juneteenthtube</p>
                </div>
            </div>
        );
    }

    const currentProgram = getCurrentProgram(currentChannel);

    // Group channels by category
    const channelsByCategory = categories
        .filter(cat => cat !== "All")
        .map(cat => ({
            category: cat,
            channels: channels.filter(c => c.category === cat)
        }))
        .filter(group => group.channels.length > 0);

    return (
        <div className="min-h-screen bg-[#141414] text-white font-sans">

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HERO SECTION — Currently playing channel                   */}
            {/* ═══════════════════════════════════════════════════════════ */}

            {/* Header Info Area (Above Player) */}
            <div className="w-full px-6 md:px-12 py-4 md:py-6 bg-[#141414] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20 relative">

                {/* Left side: Channel Info and Controls */}
                <div className="flex flex-col gap-3">
                    {/* Up/Down Controls & Name */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => {
                                    const idx = channels.findIndex(c => c.id === currentChannel.id);
                                    setCurrentChannel(channels[(idx - 1 + channels.length) % channels.length]);
                                }}
                                className="p-1.5 md:p-2 hover:bg-white/20 rounded-md transition-colors"
                                title="Previous Channel"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <div className="w-px bg-white/10 mx-1 self-stretch" />
                            <button
                                onClick={() => {
                                    const idx = channels.findIndex(c => c.id === currentChannel.id);
                                    setCurrentChannel(channels[(idx + 1) % channels.length]);
                                }}
                                className="p-1.5 md:p-2 hover:bg-white/20 rounded-md transition-colors"
                                title="Next Channel"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            {currentChannel.logo_url && (
                                <img
                                    src={currentChannel.logo_url}
                                    alt={currentChannel.name}
                                    className="w-8 h-8 md:w-12 md:h-12 rounded object-cover bg-black/50 shadow-sm border border-white/5"
                                />
                            )}
                            <h1 className="text-xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                                {currentProgram ? currentProgram.title : currentChannel.name}
                            </h1>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-white/60 text-sm md:text-base font-medium max-w-3xl line-clamp-1 ml-[72px]">
                        {currentProgram ? currentProgram.description : currentChannel.description}
                    </p>
                </div>

                {/* Right side: Back Menu */}
                <Link
                    href="/"
                    className="inline-flex items-center text-white/70 hover:text-white text-sm font-bold transition-colors group/link bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 shrink-0"
                    title="Back to Home"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5 group-hover/link:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Video Player Boundary */}
            <div className="relative w-full aspect-[21/9] md:aspect-video max-h-[70vh] bg-black border-y border-white/10 shadow-2xl">
                <LivePlayer streamUrl={currentChannel.stream_url} playlist={currentChannel.playlist} />
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* CHANNEL ROWS — Grouped by category, Netflix-style           */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <div className="relative z-30 -mt-4 pb-20">
                {channelsByCategory.map(group => (
                    <ChannelRow
                        key={group.category}
                        title={group.category}
                        channels={group.channels}
                        currentChannelId={currentChannel.id}
                        onSelect={setCurrentChannel}
                    />
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* CHANNEL ROW — Horizontal scrolling row of channel cards                */
/* ═══════════════════════════════════════════════════════════════════════ */
function ChannelRow({ title, channels, currentChannelId, onSelect }: {
    title: string;
    channels: Channel[];
    currentChannelId: string;
    onSelect: (c: Channel) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeft(el.scrollLeft > 20);
        setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', checkScroll);
        return () => { if (el) el.removeEventListener('scroll', checkScroll); };
    }, [channels]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div className="mb-6 md:mb-8 group/row">
            <h2 className="text-lg md:text-xl font-bold px-6 md:px-12 mb-2 md:mb-3 text-white/90 tracking-wide">
                {title}
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                {showLeft && (
                    <button
                        onClick={() => scroll('left')}
                        title="Scroll Left"
                        className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-r from-[#141414] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                    >
                        <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                )}

                {/* Scrollable Row */}
                <div
                    ref={scrollRef}
                    className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-6 md:px-12 scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {channels.map(channel => (
                        <ChannelCard
                            key={channel.id}
                            channel={channel}
                            isActive={channel.id === currentChannelId}
                            onSelect={() => onSelect(channel)}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                {showRight && (
                    <button
                        onClick={() => scroll('right')}
                        title="Scroll Right"
                        className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-l from-[#141414] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                    >
                        <ChevronRight className="w-8 h-8 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* CHANNEL CARD — Individual channel tile                                  */
/* ═══════════════════════════════════════════════════════════════════════ */
function ChannelCard({ channel, isActive, onSelect }: {
    channel: Channel;
    isActive: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`group relative shrink-0 w-[160px] md:w-[220px] rounded-md overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 outline-none
                ${isActive ? 'ring-2 ring-red-500 scale-105 z-10' : 'ring-0'}
            `}
        >
            {/* Card Image */}
            <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                {channel.logo_url ? (
                    <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center">
                        <span className="text-3xl font-black text-white/30">{channel.name.charAt(0)}</span>
                    </div>
                )}

                {/* Hover Play Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-xl">
                        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </div>
                </div>

                {/* Live indicator */}
                {isActive && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded px-1.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Live</span>
                    </div>
                )}
            </div>

            {/* Card Info */}
            <div className="bg-zinc-800/80 px-3 py-2.5">
                <h3 className={`text-xs md:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                    {channel.name}
                </h3>
                {channel.description && (
                    <p className="text-white/40 text-[10px] md:text-xs truncate mt-0.5">{channel.description}</p>
                )}
            </div>
        </button>
    );
}
