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
    Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminDashboard() {
    const { videos, deleteVideo } = useVideo();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Statistics
    const stats = {
        total: videos.length,
        completed: videos.filter(v => v.transcodeStatus === 'completed').length,
        failed: videos.filter(v => v.transcodeStatus === 'failed').length,
        pending: videos.filter(v => !v.transcodeStatus || v.transcodeStatus === 'pending').length,
    };

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || v.transcodeStatus === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleReTriggerTranscode = async (videoId: string, sourceKey: string) => {
        try {
            const res = await fetch('/api/transcode', {
                method: 'POST',
                body: JSON.stringify({ videoId, sourceKey })
            });
            if (res.ok) {
                alert('Transcode re-triggered successfully!');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to re-trigger transcode');
        }
    };

    return (
        <div className="min-h-screen pt-20 px-4 pb-12 bg-black">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-j-red mb-1">
                            <Shield className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Admin Control</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Platform Dashboard</h1>
                    </div>
                    <Link
                        href="/studio"
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-bold text-sm"
                    >
                        Juneteenth Studio <ChevronRight className="w-4 h-4" />
                    </Link>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Videos", value: stats.total, icon: Video, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
                        { label: "Pending", value: stats.pending, icon: Clock, color: "text-j-gold", bg: "bg-j-gold/10" },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-white/10">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Video Management Section */}
                <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-j-red" />
                            Video Management
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search videos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-red/50 w-full sm:w-64"
                                />
                            </div>
                            {/* Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                title="Filter videos by transcode status"
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-red/50"
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Video Info</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredVideos.map((video) => (
                                    <tr key={video.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 aspect-video rounded-lg bg-white/5 border border-white/10 overflow-hidden relative group">
                                                    {video.thumbnail ? (
                                                        <Image
                                                            src={video.thumbnail}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Video className="w-6 h-6 text-white/20" />
                                                        </div>
                                                    )}
                                                    <Link
                                                        href={`/watch/${video.id}`}
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                    >
                                                        <ExternalLink className="w-6 h-6 text-white" />
                                                    </Link>
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm line-clamp-1">{video.title}</p>
                                                    <p className="text-xs text-gray-500 font-mono mt-1">{video.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                                video.transcodeStatus === 'completed' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                    video.transcodeStatus === 'failed' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                        "bg-j-gold/10 text-j-gold border border-j-gold/20"
                                            )}>
                                                {video.transcodeStatus === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                                {video.transcodeStatus === 'failed' && <XCircle className="w-3 h-3" />}
                                                {(!video.transcodeStatus || video.transcodeStatus === 'pending') && <Clock className="w-3 h-3 animate-pulse" />}
                                                {video.transcodeStatus || 'pending'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (!video.videoUrl) return;
                                                        const sourceKey = video.videoUrl.split('/').pop();
                                                        if (sourceKey) handleReTriggerTranscode(video.id, sourceKey);
                                                    }}
                                                    disabled={!video.videoUrl}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-all",
                                                        !video.videoUrl
                                                            ? "text-gray-600 cursor-not-allowed"
                                                            : "text-gray-400 hover:text-white hover:bg-white/10"
                                                    )}
                                                    title={!video.videoUrl ? "Missing Video URL" : "Re-trigger Transcode"}
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this video?')) {
                                                            deleteVideo(video.id);
                                                        }
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-j-red hover:bg-red-500/10 rounded-lg transition-all"
                                                    title="Delete Video"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredVideos.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                            No videos found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
