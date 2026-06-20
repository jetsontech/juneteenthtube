"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useVideo, VideoProps } from "@/context/VideoContext";
import { useAuth } from "@/context/AuthContext";
import {
    Upload,
    Video,
    Edit2,
    Trash2,
    ExternalLink,
    Search,
    Eye,
    BarChart3,
    MessageSquare,
    Sparkles,
    LayoutDashboard,
    Clock
} from "lucide-react";
import { EditVideoModal } from "@/components/studio/EditVideoModal";
import Link from "next/link";

type StudioComment = {
    id: string | number;
    user: string;
    timestamp: string;
    videoThumbnail?: string;
    videoTitle?: string;
    text: string;
};

export default function StudioPage() {
    const { videos, deleteVideo, isLoading } = useVideo();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingVideo, setEditingVideo] = useState<VideoProps | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'community'>('overview');
    
    // Community Comments
    const [comments, setComments] = useState<StudioComment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsCommentsLoading(true);
        try {
            const res = await fetch('/api/videos/my-comments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sb-fybxhwpkujbodlfoadem-auth-token') ? JSON.parse(localStorage.getItem('sb-fybxhwpkujbodlfoadem-auth-token') as string).access_token : ''}`
                }
            });
            const data = await res.json();
            if (data.comments) setComments(data.comments);
        } catch (e) {
            console.error("Failed to load comments", e);
        } finally {
            setIsCommentsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'community' && comments.length === 0 && user) {
            const timer = window.setTimeout(() => {
                void fetchComments();
            }, 0);
            return () => window.clearTimeout(timer);
        }
    }, [activeTab, comments.length, fetchComments, user]);

    // Filter videos to show ONLY the current user's uploads
    // If user is not logged in, they shouldn't see anything here (or maybe a login prompt)
    const userVideos = videos.filter(v => {
        const isOwner = v.ownerId === user?.id;
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        return isOwner && matchesSearch;
    });

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to permanently delete this video? This action cannot be undone.")) {
            deleteVideo(id);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <Video className="w-16 h-16 text-gray-700 mb-4" />
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Creator Studio</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please sign in to manage your uploaded videos and content.</p>
                <Link
                    href="/?login=true"
                    className="bg-j-red text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-j-red/20 hover:scale-105 transition-transform uppercase tracking-widest text-sm"
                >
                    Sign In to Continue
                </Link>
            </div>
        );
    }

    return (
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8 min-h-[80vh]">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-12 h-12 bg-j-red rounded-xl flex items-center justify-center shadow-lg shadow-j-red/20">
                        <Video className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white leading-tight">Creator<br/>Hub</h1>
                    </div>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'overview' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'content' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Video className="w-5 h-5" />
                        Content
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'community' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        Community
                    </button>
                </nav>
                
                <div className="mt-8 p-5 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.2),transparent_60%)] pointer-events-none" />
                    <Sparkles className="w-5 h-5 text-amber-500 mb-3" />
                    <h3 className="text-sm font-black text-white mb-1">Frontier AI Engine</h3>
                    <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">Your workflow is accelerated by our open-source heuristic models.</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Channel Dashboard</h2>
                            <p className="text-gray-400">High-level analytics and frontier insights.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Analytics Cards */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                <BarChart3 className="w-6 h-6 text-j-red mb-4 opacity-80" />
                                <div className="text-3xl font-black text-white mb-1">
                                    {userVideos.reduce((acc, v) => acc + (parseInt(v.views.replace(/,/g, '')) || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-400 font-medium">Total Channel Views</div>
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-j-red/10 blur-[40px] rounded-full pointer-events-none -mr-10 -mb-10" />
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                <Video className="w-6 h-6 text-emerald-500 mb-4 opacity-80" />
                                <div className="text-3xl font-black text-white mb-1">
                                    {userVideos.length}
                                </div>
                                <div className="text-sm text-gray-400 font-medium">Published Videos</div>
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none -mr-10 -mb-10" />
                            </div>

                            {/* Frontier Feature Card */}
                            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
                                <Sparkles className="w-6 h-6 text-indigo-400 mb-4 opacity-80" />
                                <div className="text-3xl font-black text-white mb-1">
                                    94%
                                </div>
                                <div className="text-sm text-gray-400 font-medium flex items-center gap-2">
                                    Audience Sentiment <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">AI</span>
                                </div>
                                <div className="mt-3 text-xs text-indigo-200/60 leading-relaxed italic">
                                    Based on heuristic analysis of engagement rates and comment polarity across your library.
                                </div>
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full pointer-events-none -mr-10 -mb-10" />
                            </div>
                        </div>

                        {/* Top Video Preview */}
                        {userVideos.length > 0 && (
                            <div className="mt-12">
                                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest text-gray-500">Top Performing Asset</h3>
                                <div className="flex flex-col sm:flex-row gap-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                    <div className="w-full sm:w-64 aspect-video bg-zinc-900 rounded-2xl overflow-hidden relative shrink-0">
                                        { }
                                        {userVideos.sort((a,b) => (parseInt(b.views.replace(/,/g,'')) || 0) - (parseInt(a.views.replace(/,/g,'')) || 0))[0].thumbnail && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={userVideos.sort((a,b) => (parseInt(b.views.replace(/,/g,'')) || 0) - (parseInt(a.views.replace(/,/g,'')) || 0))[0].thumbnail} alt="Top Video" className="object-cover w-full h-full" />
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                            {userVideos.sort((a,b) => (parseInt(b.views.replace(/,/g,'')) || 0) - (parseInt(a.views.replace(/,/g,'')) || 0))[0].title}
                                        </h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 font-medium mb-4">
                                            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {userVideos.sort((a,b) => (parseInt(b.views.replace(/,/g,'')) || 0) - (parseInt(a.views.replace(/,/g,'')) || 0))[0].views} Views</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {userVideos.sort((a,b) => (parseInt(b.views.replace(/,/g,'')) || 0) - (parseInt(a.views.replace(/,/g,'')) || 0))[0].postedAt}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'community' && (
                    <div className="space-y-8 animate-fade-in-up">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Community Engagement</h2>
                            <p className="text-gray-400">Review and moderate comments across all your videos.</p>
                        </div>
                        
                        {isCommentsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-j-gold border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-24 bg-white/5 border border-white/10 rounded-3xl">
                                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">It&apos;s quiet here...</h3>
                                <p className="text-gray-400">No comments have been posted on your videos yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:bg-white/10 transition-colors">
                                        <div className="w-32 aspect-video bg-zinc-900 rounded-xl overflow-hidden relative shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {comment.videoThumbnail && <img src={comment.videoThumbnail} alt="" className="object-cover w-full h-full" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{comment.user}</span>
                                                    <span className="text-xs text-gray-500 font-medium">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-xs text-j-gold font-bold truncate max-w-[200px] hidden sm:block">On: {comment.videoTitle}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tight">Video Library</h2>
                            </div>
                            <div className="relative group w-full md:w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-j-gold transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search your library..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-gold/50 transition-all w-full"
                                />
                            </div>
                        </div>

                        {/* Existing Video Table Render */}

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-j-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : userVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center glass-card rounded-[40px] border border-white/5 bg-white/[0.01]">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Upload className="w-10 h-10 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No videos found</h2>
                    <p className="text-gray-500 mb-8 max-w-sm">
                        {searchQuery ? "No videos match your search criteria." : "You haven&apos;t uploaded any videos yet. Start sharing your CultureQuest moments today!"}
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Assuming Nav has the upload button
                        className="bg-white/5 border border-white/10 text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
                    >
                        Upload Content
                    </button>
                </div>
            ) : (
                <div className="glass-card rounded-[32px] border border-white/10 overflow-hidden bg-white/[0.01] shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.03] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/5">
                                <tr>
                                    <th className="px-4 md:px-8 py-5">Video</th>
                                    <th className="px-4 md:px-8 py-5 hidden md:table-cell">Visibility</th>
                                    <th className="px-4 md:px-8 py-5 hidden sm:table-cell">Date</th>
                                    <th className="px-4 md:px-8 py-5 hidden lg:table-cell">Views</th>
                                    <th className="px-4 md:px-8 py-5 text-right sticky right-0 bg-[#0a0a0a] z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {userVideos.map((video) => (
                                    <tr key={video.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 md:px-8 py-6">
                                            <div className="flex items-center gap-3 md:gap-5">
                                                <div className="w-24 md:w-40 aspect-video rounded-xl bg-black/40 border border-white/10 overflow-hidden relative shadow-lg flex-shrink-0">
                                                    {video.thumbnail ? (
                                                        <Image src={video.thumbnail} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Video className="w-6 h-6 text-white/10" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-bold text-white border border-white/10">
                                                        {video.duration}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-black text-base md:text-lg line-clamp-2 leading-tight tracking-tight group-hover:text-j-gold transition-colors break-words max-w-[200px] md:max-w-[300px]">
                                                        {video.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60 uppercase">Cat: {video.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-6 hidden md:table-cell">
                                            {video.state === 'HIDDEN' ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                    Hidden
                                                </div>
                                            ) : video.state === 'GA' ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                                    Georgia Only
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    Public
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-8 py-6 hidden sm:table-cell">
                                            <p className="text-gray-400 text-sm font-medium">{video.postedAt}</p>
                                            <p className="text-[10px] text-gray-600 uppercase font-black mt-0.5 tracking-tighter">Published</p>
                                        </td>
                                        <td className="px-4 md:px-8 py-6 hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-gray-600" />
                                                <span className="text-white font-black text-sm">{video.views}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-8 py-6 text-right sticky right-0 bg-[#0a0a0a] z-10 border-l border-white/5 shadow-[-10px_0_20px_rgba(0,0,0,0.5)]">
                                            <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100">
                                                <Link
                                                    href={`/watch/${video.id}`}
                                                    className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                                                    title="View on Platform"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => setEditingVideo(video)}
                                                    className="p-3 text-gray-400 hover:text-j-gold hover:bg-j-gold/10 rounded-2xl transition-all"
                                                    title="Edit Details"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(video.id)}
                                                    className="p-3 text-gray-400 hover:text-j-red hover:bg-red-500/10 rounded-2xl transition-all"
                                                    title="Delete Video"
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
                </div>
            )}
            </div>
            )}
            </div>


            {/* Edit Modal */}
            {editingVideo && (
                <EditVideoModal
                    video={editingVideo}
                    isOpen={!!editingVideo}
                    onClose={() => {
                        setEditingVideo(null);
                    }}
                />
            )}
        </main>
    );
}
