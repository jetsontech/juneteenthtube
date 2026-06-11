"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useVideo } from "@/context/VideoContext";
import { useAuth } from "@/context/AuthContext";

import {
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
    Ban,
    FileVideo,
    ShieldCheck,
    UserCheck,
    Star,
    TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { VAULT_ITEMS } from "@/components/interactive/LegacyVault";

export default function AdminDashboard() {
    const { videos, deleteVideo, toggleVideoFeatured, toggleVideoTrending, updateVideoFeaturedText } = useVideo();
    const { session } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterCuration, setFilterCuration] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"videos" | "users" | "vault">("videos");

    const [vaultOverrides, setVaultOverrides] = useState<Record<string, boolean>>({});
    const [isOrganicTrendingPaused, setIsOrganicTrendingPaused] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    setIsOrganicTrendingPaused(!!data.pauseOrganicTrending);
                }
            } catch (e) {
                console.error("Failed to load settings:", e);
            }
        }
        loadSettings();
    }, []);

    const handleToggleOrganicTrending = async () => {
        const newVal = !isOrganicTrendingPaused;
        setIsOrganicTrendingPaused(newVal);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ pauseOrganicTrending: newVal })
            });
            if (!res.ok) {
                alert("Failed to update algorithm controls");
                setIsOrganicTrendingPaused(!newVal); // revert
            }
        } catch (e) {
            console.error(e);
            alert("Failed to update algorithm controls");
            setIsOrganicTrendingPaused(!newVal); // revert
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const saved = localStorage.getItem("jtube_vault_elder_verified");
                if (saved) {
                    setVaultOverrides(JSON.parse(saved));
                } else {
                    // Initialize default overrides
                    const initial: Record<string, boolean> = Object.create(null);
                    VAULT_ITEMS.forEach(item => {
                        if (item.id && !["__proto__", "constructor", "prototype"].includes(item.id)) {
                            Reflect.set(initial, item.id, item.isElderVerified);
                        }
                    });
                    localStorage.setItem("jtube_vault_elder_verified", JSON.stringify(initial));
                    setVaultOverrides(initial);
                }
            } catch (e) {
                console.error("Failed to load overrides", e);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleVaultVerification = (id: string) => {
        if (!id || ["__proto__", "constructor", "prototype"].includes(id)) return;

        const hasOverride = Reflect.has(vaultOverrides, id);
        const currentVal = hasOverride
            ? Reflect.get(vaultOverrides, id)
            : (VAULT_ITEMS.find(item => item.id === id)?.isElderVerified || false);

        const updated = {
            ...vaultOverrides
        };
        Reflect.set(updated, id, !currentVal);

        setVaultOverrides(updated);
        localStorage.setItem("jtube_vault_elder_verified", JSON.stringify(updated));
        
        // Dispatch same-tab sync event
        window.dispatchEvent(new Event("jtube_vault_sync"));
    };

    // Statistics
    const stats = {
        total: videos.length,
        completed: videos.filter(v => v.transcodeStatus === 'completed').length,
        failed: videos.filter(v => v.transcodeStatus === 'failed').length,
        users: 142, // Mock users count
        pendingModeration: 8, // Mock pending
    };

    const parseViews = (viewsStr: string) => {
        if (!viewsStr) return 0;
        const num = parseFloat(viewsStr.replace(/[^0-9.]/g, ''));
        if (viewsStr.toLowerCase().includes('k')) return num * 1000;
        if (viewsStr.toLowerCase().includes('m')) return num * 1000000;
        return num;
    };

    const curatedTrending = videos.filter(v => v.isTrending);
    const curatedIds = new Set(curatedTrending.map(v => v.id));
    const topViewed = [...videos]
        .filter(v => !curatedIds.has(v.id))
        .sort((a, b) => parseViews(b.views) - parseViews(a.views));
        
    const activeTrendingIds = new Set([...curatedTrending, ...topViewed].slice(0, 10).map(v => v.id));

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || v.transcodeStatus === filterStatus;
        const matchesCuration = filterCuration === 'all' || 
            (filterCuration === 'trending' && activeTrendingIds.has(v.id)) || 
            (filterCuration === 'trending-organic' && activeTrendingIds.has(v.id) && !v.isTrending) || 
            (filterCuration === 'trending-promoted' && v.isTrending) || 
            (filterCuration === 'featured' && v.isFeatured);
        return matchesSearch && matchesStatus && matchesCuration;
    });

    // Mock Users Data
    const mockUsers = [
        { id: '1', email: 'atl.parade@example.com', name: 'Atlanta Parade Official', status: 'active', uploads: 12, joined: '2024-01-15' },
        { id: '2', email: 'user123@gmail.com', name: 'John Doe', status: 'active', uploads: 3, joined: '2024-02-10' },
        { id: '3', email: 'spammer@bot.com', name: 'Bot Account', status: 'suspended', uploads: 45, joined: '2024-02-18' },
        { id: '4', email: 'heritage.creator@edu.org', name: 'History Channel', status: 'active', uploads: 8, joined: '2023-11-20' },
    ];

    const handleReTriggerTranscode = async (videoId: string) => {
        try {
            const res = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({ id: videoId, transcode_status: 'pending' })
            });
            if (res.ok) alert('Transcode re-queued successfully! The worker will pick it up shortly.');
        } catch (e) {
            console.error(e);
            alert('Failed to re-queue transcode');
        }
    };

    return (
        <div className="min-h-screen pt-20 px-4 pb-12 bg-transparent">
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

                {/* Algorithm Controls */}
                <div className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-j-gold mb-1.5">
                                <TrendingUp className="w-4 h-4 text-j-gold" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Algorithm Controls</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium max-w-3xl leading-relaxed">
                                Manage homepage curation feeds. Pausing **Organic Trending** will freeze automatic view-driven curation and only show promoted trending videos on the home rail, giving you absolute control over the platform spotlight.
                            </p>
                        </div>
                        <div className="flex items-center gap-3.5 self-start md:self-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">
                                Organic Trending:
                            </span>
                            <button
                                onClick={handleToggleOrganicTrending}
                                className={cn(
                                    "px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer border",
                                    isOrganicTrendingPaused
                                        ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                        : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:scale-105 active:scale-95"
                                )}
                            >
                                {isOrganicTrendingPaused ? "⏸ PAUSED" : "▶ ACTIVE"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-white/[0.01]">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 bg-white/[0.02] overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab("videos")}
                            className={cn(
                                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
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
                                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                                activeTab === "users" ? "text-j-gold" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Users className="w-4 h-4" /> User Accounts
                            </span>
                            {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-j-gold" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("vault")}
                            className={cn(
                                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                                activeTab === "vault" ? "text-j-gold" : "text-gray-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" /> Legacy Vault Archives
                            </span>
                            {activeTab === "vault" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-j-gold" />}
                        </button>
                    </div>

                    {activeTab === "videos" && (
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
                                    {/* Curation Filter */}
                                    <select
                                        value={filterCuration}
                                        onChange={(e) => setFilterCuration(e.target.value)}
                                        title="Curation Status"
                                        className="bg-black/40 border border-white/10 rounded-2xl px-6 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-j-red/50 appearance-none cursor-pointer"
                                    >
                                        <option value="all">ALL CURATION</option>
                                        <option value="trending">ALL TRENDING</option>
                                        <option value="trending-organic">ORGANIC TRENDING</option>
                                        <option value="trending-promoted">PROMOTED TRENDING</option>
                                        <option value="featured">FEATURED ONLY</option>
                                    </select>
                                    
                                    {/* Status Filter */}
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
                                            <th className="px-8 py-4">Featured</th>
                                            <th className="px-8 py-4 text-right">Moderation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredVideos.map((video) => {
                                            return (
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
                                                                {video.isFeatured && (video.featuredTitle || video.featuredCategory) && (
                                                                    <div className="mt-1.5 p-2 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] max-w-xs shadow-[0_0_15px_rgba(245,158,11,0.02)]">
                                                                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider block mb-0.5">Featured Text Overrides:</span>
                                                                        {video.featuredTitle && <p className="text-zinc-300 font-medium">Title: <span className="text-white font-bold">{video.featuredTitle}</span></p>}
                                                                        {video.featuredCategory && <p className="text-zinc-400 text-[10px] mt-0.5">Category: <span className="text-amber-400 font-bold">{video.featuredCategory}</span></p>}
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-gray-500 font-mono mt-1 opacity-60">ID: {video.id}</p>
                                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                    <span className="text-[10px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase">{video.category}</span>
                                                                    <span className="text-[10px] font-black text-gray-600 uppercase">Uploaded {video.postedAt}</span>
                                                                    {video.isTrending && (
                                                                        <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                                            <Shield className="w-3 h-3 text-blue-400" />
                                                                            Trending (Promoted)
                                                                        </span>
                                                                    )}
                                                                    {activeTrendingIds.has(video.id) && !video.isTrending && (
                                                                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)] animate-pulse">
                                                                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                                                                            Trending (Organic)
                                                                        </span>
                                                                    )}
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
                                                    <td className="px-8 py-6">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    if (video.isFeatured) toggleVideoFeatured(video.id, true);
                                                                    if (video.isTrending) toggleVideoTrending(video.id, true);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                                                    !video.isFeatured && !video.isTrending
                                                                        ? "bg-white/20 text-white border-white/30"
                                                                        : "bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10"
                                                                )}
                                                            >
                                                                Standard
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    if (!video.isFeatured) toggleVideoFeatured(video.id, false);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                                                    video.isFeatured
                                                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                                                        : "bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10"
                                                                )}
                                                            >
                                                                <Star className={cn("w-3 h-3", video.isFeatured ? "fill-amber-500 text-amber-500" : "text-gray-500")} />
                                                                Featured
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    if (!video.isTrending) toggleVideoTrending(video.id, false);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                                                    activeTrendingIds.has(video.id)
                                                                        ? "bg-j-red/10 text-j-red border-j-red/20 shadow-[0_0_15px_rgba(229,9,20,0.15)]"
                                                                        : "bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10"
                                                                )}
                                                            >
                                                                <TrendingUp className={cn("w-3 h-3", activeTrendingIds.has(video.id) ? "text-j-red" : "text-gray-500")} />
                                                                Trending
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    if (video.isTrending) toggleVideoTrending(video.id, true);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                                                    !activeTrendingIds.has(video.id)
                                                                        ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                                                                        : "bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10"
                                                                )}
                                                            >
                                                                Not Trending
                                                            </button>
                                                        </div>
                                                        {video.isFeatured && (
                                                            <button
                                                                onClick={() => {
                                                                    const newFTitle = prompt("Enter custom Featured Title (leave empty for original video title):", video.featuredTitle || "");
                                                                    if (newFTitle === null) return;
                                                                    const newFCat = prompt("Enter custom Featured Category (leave empty for original category):", video.featuredCategory || "");
                                                                    if (newFCat === null) return;
                                                                    updateVideoFeaturedText(video.id, newFTitle, newFCat);
                                                                }}
                                                                className="w-full mt-2.5 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:scale-[1.02] active:scale-[0.98]"
                                                            >
                                                                Edit Carousel Text
                                                            </button>
                                                        )}
                                                    </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => video.videoUrl && handleReTriggerTranscode(video.id)}
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
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === "users" && (
                        <>
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
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">User Management is currently under maintenance</h3>
                            </div>
                        </>
                    )}

                    {activeTab === "vault" && (
                        <>
                            <div className="p-8 border-b border-white/10 bg-white/[0.01]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">Elder Verification Board</h3>
                                        <p className="text-sm text-gray-400 font-medium">
                                            Moderate historical archives. Items verified by the Community Elder Council receive the golden badge in the Legacy Vault.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Active Overrides</span>
                                        <p className="text-2xl font-black text-j-gold">
                                            {Object.values(vaultOverrides).filter(Boolean).length} / {VAULT_ITEMS.length} Verified
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <tr>
                                            <th className="px-8 py-4">Archive Item Details</th>
                                            <th className="px-8 py-4">Verification Status</th>
                                            <th className="px-8 py-4 text-right">Moderation Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {VAULT_ITEMS.map((item) => {
                                             const hasOverride = item.id && !["__proto__", "constructor", "prototype"].includes(item.id) && Reflect.has(vaultOverrides, item.id);
                                             const isVerified = hasOverride ? Reflect.get(vaultOverrides, item.id) : item.isElderVerified;
                                            return (
                                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-20 aspect-[2/3] rounded-xl bg-white/5 border border-white/10 overflow-hidden relative shadow-xl">
                                                                {item.thumbnail ? (
                                                                    <Image src={item.thumbnail} alt="" fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                                                        <FileVideo className="w-6 h-6 text-white/10" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-white font-black text-base line-clamp-1 tracking-tight">{item.title}</p>
                                                                <p className="text-xs text-gray-400 font-mono mt-1 opacity-60">Source: {item.source} • {item.year}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[10px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase">{item.category}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                            isVerified ? "bg-j-gold/10 text-j-gold border-j-gold/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]" : "bg-white/5 text-gray-400 border-white/10"
                                                        )}>
                                                            {isVerified ? (
                                                                <>
                                                                    <UserCheck className="w-3.5 h-3.5" />
                                                                    <span>Elder Verified</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>Pending Verification</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => toggleVaultVerification(item.id)}
                                                            className={cn(
                                                                "px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer",
                                                                isVerified 
                                                                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent" 
                                                                    : "bg-j-gold/10 text-j-gold border border-j-gold/20 hover:bg-j-gold hover:text-black hover:border-transparent hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                                                            )}
                                                        >
                                                            {isVerified ? "Revoke Verification" : "Verify as Elder"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                    System Security Level 4 • Operational
                </p>
            </div>
        </div>
    );
}
