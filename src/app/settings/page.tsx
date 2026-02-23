"use client";

import { useState, useRef } from "react";
import { User, Bell, LogOut, ChevronRight, Shield, Video, Trash2, Edit2, Camera, Upload, Sparkles, Check, X } from "lucide-react";
import { useVideo } from "@/context/VideoContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const { videos, deleteVideo, updateVideoTitle } = useVideo();
    const [notifications, setNotifications] = useState(true);
    const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock: Assume videos with "user" in them or a subset are "mine" for demonstration
    // In a real app, we'd filter by video.user_id === user.id
    const myVideos = videos.slice(0, 3);

    const handleEditStart = (v: any) => {
        setEditingVideoId(v.id);
        setEditTitle(v.title);
    };

    const handleSaveTitle = async (id: string) => {
        if (!editTitle.trim()) return;
        await updateVideoTitle(id, editTitle.trim());
        setEditingVideoId(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] pt-20 px-4 pb-12">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Settings</h1>
                    <p className="text-gray-400 font-medium">Manage your JuneteenthTube experience</p>
                </header>

                <div className="grid grid-cols-1 gap-8">
                    {/* Account Section */}
                    <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <User className="text-j-red w-5 h-5" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Account Profile</h2>
                            </div>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                <div className="w-24 h-24 bg-gradient-to-br from-j-red via-j-gold to-j-green rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl relative overflow-hidden border-2 border-white/10 group-hover:scale-105 transition-transform">
                                    {user?.email?.[0].toUpperCase() || "J"}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-white font-bold text-2xl tracking-tight">{user?.email?.split('@')[0] || "Juneteenth User"}</h3>
                                <p className="text-gray-400 font-medium">{user?.email || "user@example.com"}</p>

                                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest border border-white/10">
                                        <Upload className="w-3.5 h-3.5" /> Upload Avatar
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest border border-white/10">
                                        <Camera className="w-3.5 h-3.5" /> Use Camera
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-j-gold/20 hover:bg-j-gold/30 rounded-xl text-xs font-bold text-j-gold transition-all uppercase tracking-widest border border-j-gold/20">
                                        <Sparkles className="w-3.5 h-3.5" /> Generate AI Avatar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Manage My Content */}
                    <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <Video className="text-j-green w-5 h-5" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">My Uploads</h2>
                            </div>
                            <span className="text-[10px] font-black bg-j-red/10 text-j-red px-2 py-1 rounded-full uppercase tracking-tighter">Manager</span>
                        </div>

                        <div className="divide-y divide-white/5">
                            {myVideos.length > 0 ? (
                                myVideos.map((v) => (
                                    <div key={v.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="w-24 aspect-video bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 relative border border-white/5">
                                            {v.thumbnail && <Image src={v.thumbnail} alt="" fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingVideoId === v.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-j-gold/50 flex-1"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleSaveTitle(v.id)} className="p-1 hover:bg-green-500/20 text-green-500 rounded"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingVideoId(null)} className="p-1 hover:bg-red-500/20 text-red-500 rounded"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="text-white font-bold text-sm truncate">{v.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-0.5">{v.views} views • {v.postedAt}</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEditStart(v)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                title="Edit Video"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => confirm('Delete this video?') && deleteVideo(v.id)}
                                                className="p-2 text-gray-400 hover:text-j-red hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete Video"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <Video className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No uploads yet</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-white/[0.01] border-t border-white/5 text-center">
                            <button
                                onClick={() => window.location.href = '/studio'}
                                className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Open Juneteenth Studio <ChevronRight className="w-3 h-3 inline ml-1" />
                            </button>
                        </div>
                    </section>

                    {/* Preferences & Security */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
                                <Bell className="text-j-gold w-5 h-5" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Notifications</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-bold text-sm">Push Notifications</h3>
                                        <p className="text-gray-500 text-xs mt-1">Updates on new content</p>
                                    </div>
                                    <button
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-all duration-300",
                                            notifications ? "bg-j-green" : "bg-white/10"
                                        )}
                                        onClick={() => setNotifications(!notifications)}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-lg",
                                            notifications ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
                                <Shield className="text-j-red w-5 h-5" />
                                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Account Access</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="w-full flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all text-white border border-transparent hover:border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-j-gold" />
                                        <span className="text-sm font-bold">Admin Panel</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                </button>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-all text-red-500 border border-transparent hover:border-red-500/20 font-bold text-sm"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                            Juneteenth Tube v1.0.2 • Platform Build 2409
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
