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

                // Map EPG data to channels
                if (channelData) {
                    const formattedChannels: Channel[] = channelData.map(c => ({
                        id: c.id,
                        name: c.name,
                        logo_url: c.logo_url,
                        stream_url: c.stream_url,
                        programs: epgData ? epgData.filter(p => p.channel_id === c.id) : []
                    }));

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
        <div className="h-screen w-full bg-black text-white flex flex-col font-sans overflow-hidden items-stretch selection:bg-red-500/30">
            {/* Header */}
            <header className="h-[72px] border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-30 bg-black/80 backdrop-blur-xl sticky top-0">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center text-white/50 hover:text-white transition-colors mr-6 shrink-0 group">
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden sm:inline">Back to On Demand</span>
                    </Link>
                    <div className="h-6 w-px bg-white/10 mr-6"></div>
                    <div className="flex items-center text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 to-amber-500 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        <Tv className="w-6 h-6 mr-2 text-white drop-shadow-none" />
                        Live TV
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="hidden md:flex items-center px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
                    System Operational
                </div>
            </header>

            {/* Main Player Area */}
            <main className="flex-1 relative flex flex-col items-center justify-center bg-black overflow-hidden group">
                {/* Immersive Background Blur extracted from video.js (Aesthetic only) */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-black to-blue-900/10 z-0 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen opacity-50"></div>

                <div className="w-full max-w-7xl h-full lg:max-h-[75vh] relative z-10 flex items-center justify-center p-0 lg:p-8">
                    <div className="w-full h-full lg:rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10 bg-black relative">
                        {/* Live Player Core Component */}
                        <LivePlayer streamUrl={currentChannel.stream_url} />

                        {/* Live Badge Overlay */}
                        <div className="absolute top-6 left-6 z-20 flex items-center bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl transition-opacity opacity-100 lg:group-hover:opacity-100 lg:opacity-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse mr-2 shadow-[0_0_8px_rgba(220,38,38,0.9)]"></span>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-white/90">Live • {currentChannel.name}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* EPG / TV Guide Section */}
            <div className="shrink-0 z-20 relative">
                {/* Guide Toolbar */}
                <div className="h-12 bg-black border-t border-white/10 flex items-center justify-between px-6 sticky top-0 z-50 shadow-2xl">
                    <h2 className="text-[11px] font-bold text-white/70 uppercase tracking-[0.2em] flex items-center">
                        <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
                        Electronic Program Guide
                    </h2>

                    {/* Time indicator */}
                    <div className="font-mono text-xs text-white/50 tracking-wider">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} PST
                    </div>
                </div>

                {/* The Scrolling Grid */}
                <div className="bg-black/80 backdrop-blur-xl h-64 lg:h-80 overflow-hidden relative border-t border-white/5">
                    {/* Timeline Guide Header (Static for now) */}
                    <div className="h-8 border-b border-white/5 flex items-center bg-white/5 text-[10px] text-white/50 font-mono uppercase tracking-widest sticky top-0 z-20">
                        <div className="w-[200px] sm:w-[280px] shrink-0 border-r border-white/5 h-full flex items-center px-6">Channel Lineup</div>
                        <div className="flex-1 px-6 h-full flex items-center">Current Programming Block</div>
                    </div>

                    <div className="absolute inset-0 top-8 overflow-y-auto custom-scrollbar">
                        <EPG
                            channels={channels}
                            currentChannelId={currentChannel.id}
                            onChannelSelect={(c) => setCurrentChannel(c)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
