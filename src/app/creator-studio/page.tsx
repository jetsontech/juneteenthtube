"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { UploadCloud, LayoutDashboard, ShieldCheck, TrendingUp, Eye, Film, BarChart3 } from "lucide-react";
import { useVideo, type VideoProps } from "@/context/VideoContext";
import Image from "next/image";
import Link from "next/link";

function StatCard({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend?: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-white tracking-tight">{value}</p>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{label}</p>
        </div>
    );
}

function VideoRow({ video, rank }: { video: VideoProps; rank: number }) {
    return (
        <Link
            href={`/watch/${video.id}`}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group"
        >
            <span className="text-zinc-500 font-mono text-sm w-6 text-right flex-shrink-0">
                {rank}
            </span>
            <div className="w-20 aspect-video rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 relative">
                {video.thumbnail && video.thumbnail !== "/placeholder.svg" ? (
                    <Image src={video.thumbnail} alt={video.title} fill sizes="80px" className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                    {video.title}
                </h4>
                <p className="text-xs text-zinc-500 mt-0.5">{video.category} • {video.postedAt}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-white">{video.views}</p>
                <p className="text-[10px] text-zinc-500">views</p>
            </div>
        </Link>
    );
}

export default function CreatorStudioPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'content'>('overview');
    const { videos, isUploading, uploadProgress, cancelUpload } = useVideo();

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, loading, router]);

    // Stats
    const stats = useMemo(() => {
        const totalViews = videos.reduce((sum, v) => {
            const cleaned = v.views.replace(/,/g, "");
            const num = parseFloat(cleaned);
            if (cleaned.includes("M")) return sum + num * 1_000_000;
            if (cleaned.includes("K")) return sum + num * 1_000;
            if (cleaned.includes("B")) return sum + num * 1_000_000_000;
            return sum + (num || 0);
        }, 0);

        const formatNum = (n: number) => {
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
            return n.toString();
        };

        return {
            totalVideos: videos.length,
            totalViews: formatNum(totalViews),
            dbVideos: videos.filter(v => v.createdAt).length,
            mockVideos: videos.filter(v => !v.createdAt).length,
        };
    }, [videos]);

    const sortedByViews = useMemo(() => {
        return [...videos].sort((a, b) => {
            const parseViews = (v: string) => {
                const cleaned = v.replace(/,/g, "");
                const num = parseFloat(cleaned);
                if (cleaned.includes("M")) return num * 1_000_000;
                if (cleaned.includes("K")) return num * 1_000;
                return num || 0;
            };
            return parseViews(b.views) - parseViews(a.views);
        });
    }, [videos]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white relative flex overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_100%_0%,_#3f2e05_0%,_transparent_70%)] opacity-30 pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_0%_100%,_#0a2f0a_0%,_transparent_70%)] opacity-20 pointer-events-none z-0" />

            {/* Sidebar */}
            <div className="hidden md:flex w-64 bg-white/[0.03] border-r border-white/[0.06] backdrop-blur-xl relative z-10 flex-col h-[calc(100vh-3.5rem)]">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-amber-400 font-black tracking-widest text-lg uppercase mb-8">
                        <ShieldCheck className="w-6 h-6" />
                        CREATOR SUITE
                    </div>
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'overview' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'content' ? 'bg-amber-400 text-black font-bold' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <Film className="w-5 h-5" />
                            Content
                        </button>
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || 'Admin'}</div>
                            <div className="text-xs text-amber-400/70 truncate">Platform Owner</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden">
                <div className="p-6 sm:p-8 max-w-6xl mx-auto">

                    {/* Mobile Tab Switcher */}
                    <div className="flex md:hidden gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-400 border border-white/10'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('content')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-amber-400 text-black' : 'bg-white/5 text-zinc-400 border border-white/10'}`}
                        >
                            Content
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Header */}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">Creator Dashboard</h1>
                                <p className="text-zinc-400 text-base">Manage your platform content and track performance.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <StatCard label="Total Videos" value={stats.totalVideos.toString()} icon={<Film className="w-5 h-5" />} />
                                <StatCard label="Total Views" value={stats.totalViews} icon={<Eye className="w-5 h-5" />} trend="+12%" />
                                <StatCard label="Uploaded" value={stats.dbVideos.toString()} icon={<UploadCloud className="w-5 h-5" />} />
                                <StatCard label="Archive" value={stats.mockVideos.toString()} icon={<BarChart3 className="w-5 h-5" />} />
                            </div>

                            {/* Upload Card */}
                            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-[60px] -mr-20 -mt-20 rounded-full pointer-events-none" />
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <UploadCloud className="w-7 h-7 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold mb-1">Upload New Content</h3>
                                        <p className="text-zinc-400 text-sm mb-4">Upload video files directly to Cloudflare R2. Supports multipart upload for large files.</p>
                                        <button
                                            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors active:scale-95 text-sm"
                                            onClick={() => {
                                                const uploadBtn = document.querySelector('[aria-label="Upload video"]') as HTMLButtonElement;
                                                if (uploadBtn) uploadBtn.click();
                                            }}
                                        >
                                            Upload Video
                                        </button>
                                    </div>
                                </div>
                                {isUploading && (
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-white font-medium">Uploading...</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-amber-400 font-bold">{uploadProgress}%</span>
                                                <button onClick={cancelUpload} className="text-xs text-red-400 hover:text-red-300 font-medium">Cancel</button>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Top Videos */}
                            <div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-amber-400" />
                                    Top Performing Videos
                                </h2>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
                                    {sortedByViews.slice(0, 10).map((video, i) => (
                                        <VideoRow key={video.id} video={video} rank={i + 1} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">Content Library</h1>
                                <p className="text-zinc-400 text-base">{videos.length} total videos in your library.</p>
                            </div>

                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
                                {videos.map((video, i) => (
                                    <VideoRow key={video.id} video={video} rank={i + 1} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
