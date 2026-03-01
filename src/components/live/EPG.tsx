"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Play } from "lucide-react";

export type Program = {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    thumbnail_url?: string;
};

export type Channel = {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    stream_url: string;
    playlist?: string[];
    programs: Program[];
};

interface EPGProps {
    channels: Channel[];
    currentChannelId: string;
    onChannelSelect: (channel: Channel) => void;
    categories: string[];
    activeCategory: string;
    onCategorySelect: (category: string) => void;
}

const PIXELS_PER_MINUTE = 8;
const HALF_HOUR_WIDTH = PIXELS_PER_MINUTE * 30; // 240px

export function EPG({ channels, currentChannelId, onChannelSelect, categories, activeCategory, onCategorySelect }: EPGProps) {
    const [now, setNow] = useState(Date.now());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update 'now' every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Calculate Grid Start Time: Always the top of the current hour, minus 30 mins for padding
    const gridStartTime = useMemo(() => {
        const d = new Date(now);
        d.setMinutes(d.getMinutes() < 30 ? 0 : 30);
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d.getTime() - (30 * 60000); // Start 30 mins before current block for context
    }, [now]); // Note: gridStartTime only updates every 30 mins realistically

    // Generate 12 hours of time slots starting from gridStartTime
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 0; i < 24; i++) { // 12 hours = 24 half-hour slots
            const slotTime = new Date(gridStartTime + (i * 30 * 60000));
            slots.push(slotTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        }
        return slots;
    }, [gridStartTime]);

    // Calculate current time indicator position
    const currentTimeOffset = ((now - gridStartTime) / 60000) * PIXELS_PER_MINUTE;

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            // Scroll to 30 mins before current time (which is the start of the grid) or roughly the start
            // Adding a small delay ensures rendering happened
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const scrollTarget = currentTimeOffset - (HALF_HOUR_WIDTH * 1.5);
                    scrollContainerRef.current.scrollLeft = Math.max(0, scrollTarget);
                }
            }, 100);
        }
    }, [currentTimeOffset]);

    return (
        <div className="w-full h-full bg-zinc-950 flex flex-col font-sans text-white/90">
            {/* The monolithic scrollable EPG container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-auto custom-scrollbar relative bg-zinc-950"
            >
                {/* TIME HEADER ROW */}
                <div className="flex sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 pt-2 pb-2">
                    {/* Empty top-left cell over the channels column */}
                    <div className="w-[120px] md:w-[240px] shrink-0 sticky left-0 z-50 bg-zinc-950/95 border-r border-white/10 shadow-[4px_0_15px_rgba(0,0,0,0.5)] flex items-end px-4 pb-1">
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Live TV</span>
                    </div>

                    {/* Timeline */}
                    <div className="flex relative items-end">
                        {timeSlots.map((time, i) => (
                            <div
                                key={i}
                                className="shrink-0 flex items-center px-4 border-l border-white/10 text-xs font-bold text-white/60 tracking-wider"
                                style={{ width: `${HALF_HOUR_WIDTH}px` }}
                            >
                                {time}
                            </div>
                        ))}

                        {/* Current Time Vertical Line indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-[2px] bg-red-600/80 shadow-[0_0_8px_rgba(220,38,38,1)] z-30 transition-all duration-1000 pointer-events-none"
                            style={{ left: `${currentTimeOffset}px`, height: '1000vh' }}
                        >
                            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,1)]"></div>
                        </div>
                    </div>
                </div>

                {/* CHANNELS AND PROGRAMS GRID */}
                <div className="flex flex-col relative pb-32">
                    {channels.map((channel) => (
                        <div key={channel.id} className="flex relative group">
                            {/* Sticky Left Channel Info */}
                            <div
                                onClick={() => onChannelSelect(channel)}
                                className={`w-[120px] md:w-[240px] shrink-0 sticky left-0 z-30 border-b border-r border-white/5 flex items-center px-3 md:px-5 py-3 md:py-4 cursor-pointer transition-colors shadow-[4px_0_15px_rgba(0,0,0,0.3)]
                                    ${currentChannelId === channel.id ? 'bg-white/10 border-l-4 border-l-red-500' : 'bg-zinc-950 hover:bg-white/5 border-l-4 border-l-transparent'}
                                `}
                            >
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-md bg-black/60 flex items-center justify-center shrink-0 mr-3 overflow-hidden shadow-inner">
                                    {channel.logo_url ? (
                                        <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-white/50">{channel.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col overflow-hidden">
                                    <h3 className={`font-bold truncate ${currentChannelId === channel.id ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{channel.name}</h3>
                                    {currentChannelId === channel.id && (
                                        <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-0.5 animate-pulse">Playing</span>
                                    )}
                                </div>
                            </div>

                            {/* Programs Track */}
                            <div className="flex relative items-stretch border-b border-white/5 bg-zinc-900/50">
                                {channel.programs && channel.programs.length > 0 ? (
                                    channel.programs.map((prog, i) => {
                                        const tStart = new Date(prog.start_time).getTime();
                                        const tEnd = new Date(prog.end_time).getTime();

                                        // Ignore programs that ended before the grid starts
                                        if (tEnd <= gridStartTime) return null;
                                        // Ignore programs that start way after our 12 hour window
                                        if (tStart >= gridStartTime + (12 * 60 * 60000)) return null;

                                        // Calculate exact left offset and width
                                        const isPast = tEnd < now;
                                        const isNowPlaying = now >= tStart && now <= tEnd;

                                        // Render logic based on start/end
                                        const renderStart = Math.max(tStart, gridStartTime);
                                        const offsetMinutes = (renderStart - gridStartTime) / 60000;
                                        const durationMinutes = (tEnd - renderStart) / 60000;

                                        const leftPos = offsetMinutes * PIXELS_PER_MINUTE;
                                        const boxWidth = durationMinutes * PIXELS_PER_MINUTE;

                                        return (
                                            <div
                                                key={prog.id}
                                                onClick={() => onChannelSelect(channel)}
                                                className={`absolute top-0 bottom-0 border-r border-white/10 p-3 md:p-4 flex flex-col justify-center cursor-pointer overflow-hidden backdrop-blur-sm transition-all
                                                    ${isNowPlaying ? 'bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/15' :
                                                        isPast ? 'bg-black/30 opacity-60' :
                                                            'bg-transparent hover:bg-white/5'}
                                                `}
                                                style={{ left: `${leftPos}px`, width: `${boxWidth}px` }}
                                            >
                                                <div className={`text-[10px] mb-1.5 font-mono uppercase tracking-widest ${isNowPlaying ? 'text-white font-bold' : 'text-white/40'}`}>
                                                    {new Date(prog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <h4 className={`text-xs md:text-sm font-bold truncate tracking-wide ${isNowPlaying ? 'text-white' : 'text-white/80'}`}>{prog.title}</h4>

                                                {/* Only show description if width is large enough (e.g., > 120px) */}
                                                {boxWidth > 120 && (
                                                    <p className="text-white/50 text-[10px] md:text-xs truncate mt-1">{prog.description}</p>
                                                )}

                                                {/* Play overlay */}
                                                <div className="absolute inset-0 bg-red-600/0 hover:bg-red-600/10 transition-colors z-20 flex items-center justify-end px-4 opacity-0 hover:opacity-100">
                                                    <Play className="w-6 h-6 text-white drop-shadow-lg" />
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    /* 24/7 Placeholder if no programs */
                                    <div
                                        onClick={() => onChannelSelect(channel)}
                                        className="absolute top-0 bottom-0 left-0 hover:bg-white/5 transition-colors cursor-pointer border-r border-white/10 flex items-center px-6"
                                        style={{ width: `${12 * 60 * PIXELS_PER_MINUTE}px` }}
                                    >
                                        <div className="flex flex-col">
                                            <h4 className="text-sm font-bold text-white/80">{channel.name} Broadcast</h4>
                                            <p className="text-xs text-white/40 italic mt-1">24/7 Continuous Programming</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Global style for hiding scrollbar if needed, though custom-scrollbar is in tailwind */}
        </div>
    );
}
