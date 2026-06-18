"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { UploadCloud, LayoutDashboard, ShieldCheck, Sparkles, X, Power } from "lucide-react";
import { useVideo } from "@/context/VideoContext";

export default function CreatorStudioPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'curation'>('overview');
    const { toggleVideoFeatured, toggleVideoTrending } = useVideo();
    const [_fileRef, _setFileRef] = useState<HTMLInputElement | null>(null);

    // Curation State
    const [isAlgorithmPaused, setIsAlgorithmPaused] = useState(false);
    type CuratedVideo = { id: string; title: string; thumbnail_url?: string | null };
    const [curatedVideos, setCuratedVideos] = useState<{ featured: CuratedVideo[], trending: CuratedVideo[] }>({ featured: [], trending: [] });
    const [isCurationLoading, setIsCurationLoading] = useState(true);

    const loadCurationState = useCallback(async () => {
        setIsCurationLoading(true);
        try {
            const [algRes, curRes] = await Promise.all([
                fetch('/api/settings/algorithm'),
                fetch('/api/videos/curated')
            ]);
            const algData = await algRes.json();
            const curData = await curRes.json();
            setIsAlgorithmPaused(algData.algorithm_paused);
            setCuratedVideos(curData);
        } catch (e) {
            console.error("Failed to load curation state", e);
        } finally {
            setIsCurationLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'curation') {
            const timer = window.setTimeout(() => {
                void loadCurationState();
            }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [activeTab, loadCurationState]);

    const handleToggleAlgorithm = async () => {
        const newState = !isAlgorithmPaused;
        setIsAlgorithmPaused(newState);
        try {
            await fetch('/api/settings/algorithm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ algorithm_paused: newState })
            });
        } catch (e) {
            console.error("Failed to toggle algorithm", e);
            setIsAlgorithmPaused(!newState); // revert on failure
        }
    };

    const handleRemoveFeatured = async (id: string) => {
        await toggleVideoFeatured(id, true);
        setCuratedVideos(prev => ({ ...prev, featured: prev.featured.filter(v => v.id !== id) }));
    };

    const handleRemoveTrending = async (id: string) => {
        await toggleVideoTrending(id, true);
        setCuratedVideos(prev => ({ ...prev, trending: prev.trending.filter(v => v.id !== id) }));
    };

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-j-gold"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative flex overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_100%_0%,_#3f2e05_0%,_transparent_70%)] opacity-30 pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_0%_100%,_#0a2f0a_0%,_transparent_70%)] opacity-20 pointer-events-none z-0" />

            {/* Premium Sidebar */}
            <div className="w-64 bg-white/5 border-r border-white/10 backdrop-blur-xl relative z-10 flex flex-col h-[calc(100vh-3.5rem)]">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-j-gold font-black tracking-widest text-lg uppercase mb-8">
                        <ShieldCheck className="w-6 h-6" />
                        CREATOR SUITE
                    </div>
                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'overview' ? 'bg-j-gold text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('curation')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'curation' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:bg-amber-500/10 hover:text-amber-500'}`}
                        >
                            <Sparkles className="w-5 h-5" />
                            Curation Center
                        </button>
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-j-green flex items-center justify-center text-white font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || 'Admin'}</div>
                            <div className="text-xs text-j-gold truncate">Platform Owner</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden">
                <div className="p-8 max-w-7xl mx-auto">

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Header */}
                            <div>
                                <h1 className="text-4xl font-black mb-2">Welcome Back, Creator</h1>
                                <p className="text-gray-400 text-lg">Manage the platform, and upload premium content.</p>
                            </div>

                            {/* Action Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Direct Upload Card */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-j-red/20 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-j-red/40 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 bg-j-red rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-j-red/20">
                                        <UploadCloud className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">VOD Upload Pipeline</h3>
                                    <p className="text-gray-400 text-sm mb-6 h-10">Directly upload new master files to Cloudflare R2 structure.</p>
                                    <button
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                        onClick={() => {
                                            // Trigger the Navbar's upload modal indirectly or show a refined state
                                            const uploadBtn = document.querySelector('[aria-label="Upload video"]') as HTMLButtonElement;
                                            if (uploadBtn) {
                                                uploadBtn.click();
                                            } else {
                                                alert("The professional VOD Pipeline is currently being optimized. Please use the standard upload button in the top navigation.");
                                            }
                                        }}
                                    >
                                        Drop Master File
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                    {activeTab === 'curation' && (
                        <div className="space-y-12 animate-fade-in-up pb-20">
                            <div>
                                <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                                    <Sparkles className="w-8 h-8 text-amber-500" />
                                    Curation Center
                                </h1>
                                <p className="text-gray-400 text-lg">Manage homepage layouts and algorithmic behaviors.</p>
                            </div>

                            {/* Master Killswitch */}
                            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-colors duration-1000 ${isAlgorithmPaused ? 'bg-red-500/20' : 'bg-emerald-500/20'}`} />
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                    <div>
                                        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                                            Organic Algorithm Status
                                        </h2>
                                        <p className="text-gray-400 max-w-xl">
                                            When paused, the platform will completely ignore organic view counts and strictly display <strong>only the videos you manually curate</strong> below in the Trending feeds.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleToggleAlgorithm}
                                        className={`shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                                            isAlgorithmPaused 
                                                ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
                                                : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                                        }`}
                                    >
                                        <Power className="w-5 h-5" />
                                        {isAlgorithmPaused ? 'Algorithm Paused' : 'Algorithm Active'}
                                    </button>
                                </div>
                            </div>

                            {isCurationLoading ? (
                                <div className="h-32 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Hero Carousel List */}
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                        <h3 className="text-xl font-black text-white mb-6 border-l-4 border-j-gold pl-3">Featured Hero Carousel</h3>
                                        <p className="text-sm text-gray-400 mb-6 italic">These videos appear at the very top of the homepage in the giant slider.</p>
                                        
                                        <div className="space-y-4">
                                            {curatedVideos.featured.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500 font-medium">No featured videos set.</div>
                                            ) : (
                                                curatedVideos.featured.map(video => (
                                                    <div key={video.id} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5 group">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-20 h-12 bg-zinc-800 rounded-md shrink-0 overflow-hidden relative">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                {video.thumbnail_url && <img src={video.thumbnail_url} alt="" className="object-cover w-full h-full" />}
                                                            </div>
                                                            <div className="truncate font-bold text-sm text-gray-200">{video.title}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveFeatured(video.id)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                                            title="Remove from Featured"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Trending List */}
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                        <h3 className="text-xl font-black text-white mb-6 border-l-4 border-red-500 pl-3">Curated Trending Rail</h3>
                                        <p className="text-sm text-gray-400 mb-6 italic">These videos are forced into the &quot;Trending Now&quot; rail. If algorithm is paused, ONLY these appear.</p>
                                        
                                        <div className="space-y-4">
                                            {curatedVideos.trending.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500 font-medium">No trending overrides set.</div>
                                            ) : (
                                                curatedVideos.trending.map(video => (
                                                    <div key={video.id} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5 group">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-20 h-12 bg-zinc-800 rounded-md shrink-0 overflow-hidden relative">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                {video.thumbnail_url && <img src={video.thumbnail_url} alt="" className="object-cover w-full h-full" />}
                                                            </div>
                                                            <div className="truncate font-bold text-sm text-gray-200">{video.title}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveTrending(video.id)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                                                            title="Remove from Trending"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}