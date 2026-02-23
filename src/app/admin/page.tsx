"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useVideo } from "@/context/VideoContext";
import {
    LayoutDashboard,
    Video,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ChevronRight,
    ExternalLink,
    Shield,
    Users,
    UserMinus,
    Ban,
    UserCheck,
    MoreVertical,
    FileVideo
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboard() {
    const { videos, deleteVideo } = useVideo();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"videos" | "users">("videos");

    // Statistics
    const stats = {
        total: videos.length,
        completed: videos.filter(v => v.transcodeStatus === 'completed').length,
        failed: videos.filter(v => v.transcodeStatus === 'failed').length,
        users: 142, // Mock users count
        pendingModeration: 8, // Mock pending
    };

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || v.transcodeStatus === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Mock Users Data
    const mockUsers = [
        { id: '1', email: 'atl.parade@example.com', name: 'Atlanta Parade Official', status: 'active', uploads: 12, joined: '2024-01-15' },
        { id: '2', email: 'user123@gmail.com', name: 'John Doe', status: 'active', uploads: 3, joined: '2024-02-10' },
        { id: '3', email: 'spammer@bot.com', name: 'Bot Account', status: 'suspended', uploads: 45, joined: '2024-02-18' },
        { id: '4', email: 'heritage.creator@edu.org', name: 'History Channel', status: 'active', uploads: 8, joined: '2023-11-20' },
    ];

    const handleReTriggerTranscode = async (videoId: string, sourceKey: string) => {
        try {
            const res = await fetch('/api/transcode', {
                method: 'POST',
                body: JSON.stringify({ videoId, sourceKey })
            });
            if (res.ok) alert('Transcode re-triggered successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to re-trigger transcode');
        }
    };

    return (
        <div className="min-h-screen pt-20 px-4 pb-12 bg-black">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-j-red mb-2">
                            <Shield className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Command Center</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter">Admin Dashboard</h1>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/studio"
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-bold text-sm"
                        >
                            Juneteenth Studio <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Platform Videos", value: stats.total, icon: FileVideo, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Active Users", value: stats.users, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Failed Transcodes", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
                        { label: "Moderation Queue", value: stats.pendingModeration, icon: Clock, color: "text-j-gold", bg: "bg-j-gold/10" },
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

                {/* Main Content Area */}
                <div className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-white/[0.01]">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 bg-white/[0.02]">
                        <button
                            onClick={() => setActiveTab("videos")}
                            className={cn(
                                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative",
                                activeTab === "videos" ? "text-j-red" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Video className="w-4 h-4" /> Video Management
                            </span>
                            {activeTab === "videos" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-j-red" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={cn(
                                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative",
                                activeTab === "users" ? "text-j-gold" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" /> User Accounts
                            </span>
                            {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-j-gold" />}
                        </button>
                    </div>

                    {activeTab === "videos" ? (
                        <>
                            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                    {/* Search */}
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Filter by title or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-red/50 w-full"
                                        />
                                    </div>
                                    {/* Filter */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        title="Transcode Status"
                                        className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-j-red/50 appearance-none cursor-pointer"
                                    >
                                        <option value="all">ALL STATUS</option>
                                        <option value="completed">COMPLETED</option>
                                        <option value="failed">FAILED</option>
                                        <option value="pending">PENDING</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-4">Content Info</th>
                                            <th className="px-8 py-4">Infrastructure</th>
                                            <th className="px-8 py-4 text-right">Moderation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredVideos.map((video) => (
                                            <tr key={video.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-32 aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl">
                                                            {video.thumbnail ? (
                                                                <Image src={video.thumbnail} alt="" fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                                    <Video className="w-6 h-6 text-white/10" />
                                                                </div>
                                                            )}
                                                            <Link href={`/watch/${video.id}`} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <ExternalLink className="w-6 h-6 text-white" />
                                                            </Link>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-black text-base line-clamp-1 tracking-tight">{video.title}</p>
                                                            <p className="text-xs text-gray-500 font-mono mt-1 opacity-60">ID: {video.id}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase">{video.category}</span>
                                                                <span className="text-[10px] font-black text-gray-600 uppercase">Uploaded {video.postedAt}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                        video.transcodeStatus === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                            video.transcodeStatus === 'failed' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                                "bg-j-gold/10 text-j-gold border-j-gold/20"
                                                    )}>
                                                        {video.transcodeStatus === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                        {video.transcodeStatus === 'failed' && <XCircle className="w-3 h-3" />}
                                                        {(!video.transcodeStatus || video.transcodeStatus === 'pending') && <Clock className="w-3 h-3 animate-pulse" />}
                                                        {video.transcodeStatus || 'pending'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => video.videoUrl && handleReTriggerTranscode(video.id, video.videoUrl.split('/').pop() || '')}
                                                            className="p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                                                            title="Re-process Video"
                                                        >
                                                            <RefreshCw className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            className="p-3 text-gray-500 hover:text-j-gold hover:bg-j-gold/10 rounded-2xl transition-all"
                                                            title="Reject/Flag Content"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirm('Permanently remove this content?') && deleteVideo(video.id)}
                                                            className="p-3 text-gray-500 hover:text-j-red hover:bg-red-500/10 rounded-2xl transition-all"
                                                            title="Remove Video"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                    <tr>
                                        <th className="px-8 py-4">User Details</th>
                                        <th className="px-8 py-4">Statistics</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {mockUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-j-red to-j-gold flex items-center justify-center text-white font-black">
                                                        {user.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-gray-400 text-sm font-bold">
                                                {user.uploads} uploads
                                                <p className="text-[10px] text-gray-600 uppercase font-black mt-0.5">Joined {user.joined}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    user.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                )}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-3 text-gray-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all" title="Reset Password">
                                                        <RefreshCw className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-3 text-gray-500 hover:text-j-gold hover:bg-j-gold/10 rounded-2xl transition-all" title="Suspend Account">
                                                        <Ban className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-3 text-gray-500 hover:text-j-red hover:bg-red-500/10 rounded-2xl transition-all" title="Delete Account">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                    System Security Level 4 • Operational
                </p>
            </div>
        </div>
    );
}
