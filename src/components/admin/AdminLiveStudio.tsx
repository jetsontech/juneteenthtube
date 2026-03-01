"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Tv,
    Trash2,
    RefreshCw,
    PlayCircle,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    Plus,
    Save
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Channel = {
    id: string;
    name: string;
    logo_url?: string;
    stream_url: string;
    status: 'active' | 'inactive';
    order_index: number;
    category?: string;
    description?: string;
    is_internal_vod: boolean;
};

export function AdminLiveStudio() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Status counts
    const activeCount = channels.filter(c => c.status === 'active').length;
    const inactiveCount = channels.filter(c => c.status === 'inactive').length;
    const internalCount = channels.filter(c => c.is_internal_vod).length;

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            if (data) setChannels(data as Channel[]);
        } catch (error) {
            console.error("Error fetching channels:", error);
            alert("Failed to load Live TV channels");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleChannelStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase
                .from('channels')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setChannels(channels.map(c =>
                c.id === id ? { ...c, status: newStatus } : c
            ));
        } catch (error) {
            console.error("Error updating channel:", error);
            alert("Failed to update channel status");
        }
    };

    const deleteChannel = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete the channel "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            // First delete associated EPG data to avoid foreign key constraints (if any)
            await supabase.from('epg_data').delete().eq('channel_id', id);

            const { error } = await supabase
                .from('channels')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setChannels(channels.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting channel:", error);
            alert("Failed to delete channel");
        }
    };

    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Live TV Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Channels", value: channels.length, icon: Tv, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Active Broadcasts", value: activeCount, icon: PlayCircle, color: "text-green-500", bg: "bg-green-500/10" },
                    { label: "Internal Loop (VOD)", value: internalCount, icon: RefreshCw, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { label: "Hidden/Offline", value: inactiveCount, icon: EyeOff, color: "text-gray-500", bg: "bg-gray-500/10" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search channels by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 flex-1 max-w-md"
                    />
                </div>

                <button
                    onClick={() => alert("Manual channel addition panel coming soon to Phase 4.")}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all font-bold text-sm shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                >
                    <Plus className="w-4 h-4" /> Add IPTV Stream
                </button>
            </div>

            {/* Channels Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        <tr>
                            <th className="px-8 py-4">Channel Details</th>
                            <th className="px-8 py-4">Status & Type</th>
                            <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-12 text-center text-white/50">
                                    <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-4" />
                                    Loading Master Control Room...
                                </td>
                            </tr>
                        ) : filteredChannels.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-12 text-center text-white/50">
                                    No channels found matching "{searchQuery}"
                                </td>
                            </tr>
                        ) : (
                            filteredChannels.map((channel) => (
                                <tr key={channel.id} className={`hover:bg-white/[0.02] transition-colors group ${channel.status === 'inactive' ? 'opacity-50 hover:opacity-100' : ''}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative shadow-lg flex-shrink-0 flex items-center justify-center">
                                                {channel.logo_url ? (
                                                    <img src={channel.logo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Tv className="w-8 h-8 text-white/20" />
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-xs md:max-w-md">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-white font-black text-base line-clamp-1 tracking-tight">{channel.name}</p>
                                                    {channel.is_internal_vod && (
                                                        <span className="bg-gradient-to-r from-red-600 to-amber-600 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest text-white shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.5)]">Original</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{channel.description || 'Continuous Stream Feed'}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded truncate max-w-[200px]">{channel.stream_url}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-2 items-start">
                                            <button
                                                onClick={() => toggleChannelStatus(channel.id, channel.status)}
                                                className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors hover:scale-105",
                                                    channel.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20" :
                                                        "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
                                                )}
                                            >
                                                {channel.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {channel.status === 'active' ? 'Broadcast Live' : 'Hidden'}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleChannelStatus(channel.id, channel.status)}
                                                className="p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                                                title={channel.status === 'active' ? "Hide Channel" : "Show Channel"}
                                            >
                                                {channel.status === 'active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => deleteChannel(channel.id, channel.name)}
                                                className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                                title="Delete Channel"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
