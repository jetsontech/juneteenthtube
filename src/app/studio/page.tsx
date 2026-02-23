"use client";

import { useState } from "react";
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
    Eye
} from "lucide-react";
import { EditVideoModal } from "@/components/studio/EditVideoModal";
import Link from "next/link";

export default function StudioPage() {
    const { videos, deleteVideo, isLoading } = useVideo();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [editingVideo, setEditingVideo] = useState<VideoProps | null>(null);

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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-j-red mb-2">
                        <Video className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Channel Content</span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Juneteenth Studio</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-j-gold transition-colors" />
                        <input
                            type="text"
                            placeholder="Search your videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-gold/50 transition-all w-full md:w-80"
                        />
                    </div>
                </div>
            </div>

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
                        {searchQuery ? "No videos match your search criteria." : "You haven't uploaded any videos yet. Start sharing your Juneteenth moments today!"}
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
                                    <th className="px-8 py-5">Video</th>
                                    <th className="px-8 py-5">Visibility</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5">Views</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {userVideos.map((video) => (
                                    <tr key={video.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-40 aspect-video rounded-xl bg-black/40 border border-white/10 overflow-hidden relative shadow-lg">
                                                    {video.thumbnail ? (
                                                        <Image src={video.thumbnail} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Video className="w-6 h-6 text-white/10" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10">
                                                        {video.duration}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-black text-lg line-clamp-1 truncate tracking-tight group-hover:text-j-gold transition-colors">
                                                        {video.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60 uppercase">Category: {video.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                Public
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-gray-400 text-sm font-medium">{video.postedAt}</p>
                                            <p className="text-[10px] text-gray-600 uppercase font-black mt-0.5 tracking-tighter">Published</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-gray-600" />
                                                <span className="text-white font-black text-sm">{video.views}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
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

            {/* Edit Modal */}
            {editingVideo && (
                <EditVideoModal
                    video={editingVideo}
                    isOpen={!!editingVideo}
                    onClose={() => {
                        setEditingVideo(null);
                        // No need for explicit refresh here as context/realtime handles state updates
                    }}
                />
            )}
        </main>
    );
}
