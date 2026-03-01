"use client";

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
    logo_url?: string;
    stream_url: string;
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

// A simple Pluto TV style grid EPG
export function EPG({ channels, currentChannelId, onChannelSelect, categories, activeCategory, onCategorySelect }: EPGProps) {
    const nowHours = Date.now();

    return (
        <div className="w-full bg-zinc-950 flex flex-col h-full">
            {/* Guide Grid */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {channels.map((channel) => (
                    <div
                        key={channel.id}
                        className={`flex items-stretch border-b border-white/5 transition-colors group ${currentChannelId === channel.id ? "bg-white/5" : "hover:bg-white/[0.02]"
                            }`}
                    >
                        {/* ... Channel Column ... */}
                        <div
                            onClick={() => onChannelSelect(channel)}
                            className="w-[200px] sm:w-[280px] shrink-0 flex items-center p-4 border-r border-white/5 cursor-pointer z-10 bg-zinc-900 sticky left-0 filter"
                        >
                            <div className="w-12 h-12 rounded bg-black/50 flex items-center justify-center shrink-0 mr-4 overflow-hidden border border-white/5">
                                {channel.logo_url ? (
                                    <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-lg text-white/50">{channel.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">{channel.name}</h3>
                                {currentChannelId === channel.id && (
                                    <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                                        On Air
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Programming Timeline Column */}
                        <div className="flex-1 flex overflow-x-auto custom-scrollbar relative">
                            {channel.programs && channel.programs.length > 0 ? (
                                channel.programs.map((prog, i) => {
                                    const tStart = new Date(prog.start_time).getTime();
                                    const tEnd = new Date(prog.end_time).getTime();
                                    const isNowPlaying = nowHours >= tStart && nowHours <= tEnd;

                                    // Calculate progress percentage if now playing
                                    let progressPercent = 0;
                                    if (isNowPlaying) {
                                        const duration = tEnd - tStart;
                                        const elapsed = nowHours - tStart;
                                        progressPercent = Math.min(100, Math.max(0, (elapsed / duration) * 100));
                                    }

                                    return (
                                        <div
                                            key={prog.id}
                                            className={`min-w-[320px] border-r border-white/5 p-4 flex flex-col justify-center relative cursor-pointer hover:bg-white/10 transition-colors ${isNowPlaying ? 'bg-white/5' : ''
                                                }`}
                                            onClick={() => onChannelSelect(channel)}
                                        >
                                            <div className={`text-[10px] mb-1 font-mono uppercase tracking-wider flex justify-between items-center ${isNowPlaying ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                                                <span>{new Date(prog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(prog.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isNowPlaying && <span className="text-xs">NOW</span>}
                                            </div>
                                            <h4 className={`text-sm font-medium truncate ${isNowPlaying ? 'text-white' : 'text-white/80'}`}>{prog.title}</h4>
                                            <p className="text-white/50 text-xs truncate mt-1">{prog.description}</p>

                                            {/* Now Playing Progress Bar Overlay */}
                                            {isNowPlaying && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                                                    <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `${progressPercent}%` }}></div>
                                                </div>
                                            )}

                                            {/* Play icon overlay on hover */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                    <Play className="w-4 h-4 text-white ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="flex-1 flex items-center p-4 text-white/30 text-sm italic">
                                    24/7 Continuous Broadcast
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
