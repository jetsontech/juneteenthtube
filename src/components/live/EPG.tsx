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
}

// A simple Pluto TV style grid EPG
export function EPG({ channels, currentChannelId, onChannelSelect }: EPGProps) {
    return (
        <div className="w-full bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {channels.map((channel) => (
                <div
                    key={channel.id}
                    className={`flex items-stretch border-b border-white/5 transition-colors group ${currentChannelId === channel.id ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                >
                    {/* Channel Column */}
                    <div
                        onClick={() => onChannelSelect(channel)}
                        className="w-[200px] sm:w-[280px] shrink-0 flex items-center p-4 border-r border-white/5 cursor-pointer z-10 bg-black/50 sticky left-0 filter backdrop-blur-xl"
                    >
                        <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center shrink-0 mr-4 overflow-hidden border border-white/10">
                            {channel.logo_url ? (
                                <img src={channel.logo_url} alt={channel.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-lg text-white/50">{channel.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{channel.name}</h3>
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
                            channel.programs.map((prog, i) => (
                                <div
                                    key={prog.id}
                                    className="min-w-[320px] border-r border-white/5 p-4 flex flex-col justify-center relative cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => onChannelSelect(channel)}
                                >
                                    <div className="text-[10px] text-white/40 mb-1 font-mono uppercase tracking-wider">
                                        {new Date(prog.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(prog.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <h4 className="text-white text-sm font-medium truncate">{prog.title}</h4>
                                    <p className="text-white/50 text-xs truncate mt-1">{prog.description}</p>

                                    {/* Play icon overlay on hover */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                                            <Play className="w-4 h-4 text-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center p-4 text-white/30 text-sm italic">
                                24/7 Continuous Broadcast
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
