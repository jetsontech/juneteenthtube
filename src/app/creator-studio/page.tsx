"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLiveStudio } from "@/components/admin/AdminLiveStudio";
import { UploadCloud, Tv, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useVideo } from "@/context/VideoContext";

export default function CreatorStudioPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'channels'>('overview');
    const { uploadVideo, isUploading, uploadProgress, cancelUpload } = useVideo();
    const [fileRef, setFileRef] = useState<HTMLInputElement | null>(null);

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
                            onClick={() => setActiveTab('channels')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'channels' ? 'bg-j-gold text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Tv className="w-5 h-5" />
                            Live Channels
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
                                <p className="text-gray-400 text-lg">Manage the platform, upload premium content, and orchestrate Live TV.</p>
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

                                {/* Channel Card */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group backdrop-blur-md relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-j-green/20 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-j-green/40 transition-all pointer-events-none" />
                                    <div className="w-12 h-12 bg-j-green rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-j-green/20">
                                        <Tv className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Live Orchestration</h3>
                                    <p className="text-gray-400 text-sm mb-6 h-10">Schedule EPG streams and manage premium channels like SAREMBOK.</p>
                                    <button
                                        className="w-full py-3 bg-j-gold text-black font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-j-gold/20"
                                        onClick={() => setActiveTab('channels')}
                                    >
                                        Manage Channels
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="animate-fade-in-up bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl p-2 h-full">
                            <AdminLiveStudio />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
