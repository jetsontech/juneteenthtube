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
    Save,
    ArrowUp,
    ArrowDown
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newChannel, setNewChannel] = useState({
        name: "",
        stream_url: "",
        logo_url: "",
        category: "Entertainment",
        description: ""
    });

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
            const response = await fetch('/api/admin/channels/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update status");
            }

            // Update local state
            setChannels(channels.map(c =>
                c.id === id ? { ...c, status: newStatus } : c
            ));
        } catch (error) {
            console.error("Error updating channel:", error);
            alert("Failed to update channel status. Check console for details.");
        }
    };

    const deleteChannel = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete the channel "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/channels/delete?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to delete channel");
            }

            // Update local state
            setChannels(channels.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting channel:", error);
            alert("Failed to delete channel. Check console for details.");
        }
    };

    const moveChannel = async (index: number, direction: 'up' | 'down') => {
        if (searchQuery) {
            alert("Please clear the search to reorder channels.");
            return;
        }

        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === channels.length - 1)
        ) return;

        const newChannels = [...channels];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap their array positions
        const temp = newChannels[index];
        newChannels[index] = newChannels[targetIndex];
        newChannels[targetIndex] = temp;

        // Reassign clean contiguous indexes to the whole array
        const updatedChannels = newChannels.map((c, i) => ({ ...c, order_index: i }));
        setChannels(updatedChannels);

        try {
            const response = await fetch('/api/admin/channels/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channels: updatedChannels.map(c => ({ id: c.id, order_index: c.order_index })) })
            });

            if (!response.ok) {
                throw new Error("Failed to save new order. Ensure you have admin permissions.");
            }

            // Optional subtle success indicator
            // alert("Channel order saved successfully!");
        } catch (error) {
            console.error("Failed to reorder channels", error);
            alert("Failed to save new order.");
            fetchChannels();
        }
    };

    const filteredChannels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAddChannel = async () => {
        if (!newChannel.name || !newChannel.stream_url) return;
        setIsSubmitting(true);

        try {
            // Find highest order index to place this at the end
            const maxOrder = channels.reduce((max, c) => Math.max(max, c.order_index || 0), 0);

            const channelData = {
                id: crypto.randomUUID(), // Fallback if DB doesn't gen
                name: newChannel.name,
                stream_url: newChannel.stream_url,
                logo_url: newChannel.logo_url || null,
                category: newChannel.category,
                description: newChannel.description || null,
                status: 'active',
                order_index: maxOrder + 1,
                is_internal_vod: false // Manual additions are external live streams
            };

            const response = await fetch('/api/admin/channels/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelData })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create channel");
            }

            // Success: Reset form, close modal, refresh grid
            setNewChannel({ name: "", stream_url: "", logo_url: "", category: "Entertainment", description: "" });
            setIsAddModalOpen(false);
            await fetchChannels();

            // Note: We don't generate EPG data here. We'll show a fallback "Live Broadcast" in the grid 
            // until a future backend script populates actual guide data, or we could add dummy data.
            // For now, EPG handles empty programs gracefully.

        } catch (error) {
            console.error("Error creating channel:", error);
            alert("Failed to create channel: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    onClick={() => setIsAddModalOpen(true)}
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
                                    No channels found matching &quot;{searchQuery}&quot;
                                </td>
                            </tr>
                        ) : (
                            filteredChannels.map((channel, idx) => (
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
                                            {!searchQuery && (
                                                <div className="flex flex-col gap-1 mr-4 opacity-50 hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => moveChannel(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moveChannel(idx, 'down')}
                                                        disabled={idx === filteredChannels.length - 1}
                                                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
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

            {/* Add Channel Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                    <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="text-red-500 w-6 h-6" /> Add New Broadcast
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
                                title="Close Modal"
                                aria-label="Close add channel modal"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Channel Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="e.g. CNN International"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Stream URL (M3U8) <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newChannel.stream_url}
                                    onChange={e => setNewChannel({ ...newChannel, stream_url: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all placeholder:text-white/20 font-mono text-sm"
                                    placeholder="https://example.com/stream.m3u8"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    value={newChannel.category}
                                    onChange={e => setNewChannel({ ...newChannel, category: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all appearance-none"
                                    title="Select Category"
                                    aria-label="Channel Category"
                                >
                                    {["Entertainment", "Movies", "News", "Music", "Kids", "Sports", "Local"].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    value={newChannel.logo_url}
                                    onChange={e => setNewChannel({ ...newChannel, logo_url: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all placeholder:text-white/20"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                                <textarea
                                    value={newChannel.description}
                                    onChange={e => setNewChannel({ ...newChannel, description: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-all placeholder:text-white/20 h-24 resize-none"
                                    placeholder="Short description of the broadcast..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleAddChannel}
                                    disabled={!newChannel.name || !newChannel.stream_url || isSubmitting}
                                    className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-white/5 disabled:text-white/30 text-white py-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:shadow-none"
                                >
                                    {isSubmitting ? (
                                        <><RefreshCw className="w-5 h-5 animate-spin" /> Processing...</>
                                    ) : (
                                        <><Save className="w-5 h-5" /> Launch Broadcast Channel</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
