"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Search, Play, Info, UserCheck, Film, Database, Megaphone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlackCinemaGallery } from "@/components/video/BlackCinemaGallery";
import { CivilRightsGallery } from "@/components/video/CivilRightsGallery";

/**
 * LEGACY VAULT - "BILLION DOLLAR" EDITION
 * 
 * Design Philosophy:
 * - "Cinema First": Dark, immersive, poster-led.
 * - "Minimalist UI": Glassmorphism, subtle gradients
 * - "Functional Player": Direct access to archival content via video tag.
 */

interface LegacyItem {
    id: string;
    title: string;
    year: string;
    source: string;
    thumbnail: string;
    videoUrl: string; // Added videoUrl
    isElderVerified: boolean;
    category: "Oral History" | "Documentary" | "Performance" | "Archival";
}

// Curated "Netflix-grade" data WITH VIDEO URLs
const VAULT_ITEMS: LegacyItem[] = [
    {
        id: "1",
        title: "The Spirit of 1865",
        year: "1924",
        source: "Heritage Society",
        thumbnail: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=800",
        videoUrl: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
        isElderVerified: true,
        category: "Oral History"
    },
    {
        id: "2",
        title: "Buffalo Soldiers Legacy",
        year: "2023",
        source: "Col. Richardson",
        thumbnail: "https://images.unsplash.com/photo-1526857240824-92be52581d9f?q=80&w=800",
        videoUrl: "https://archive.org/download/TheSymbolOfTheUnconquered1920/The%20Symbol%20Of%20the%20Unconquered%20%281920%29.mp4",
        isElderVerified: true,
        category: "Archival"
    },
    {
        id: "3",
        title: "Sweet Auburn Sonic Journey",
        year: "2024",
        source: "ATL Music Collective",
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
        videoUrl: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
        isElderVerified: false,
        category: "Performance"
    },
    {
        id: "4",
        title: "Harlem Renaissance Art",
        year: "1933",
        source: "WPA Project",
        thumbnail: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=800",
        videoUrl: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
        isElderVerified: true,
        category: "Documentary"
    },
    {
        id: "5",
        title: "The Green Book Guide",
        year: "1936",
        source: "Schomburg Center",
        thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800",
        videoUrl: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
        isElderVerified: true,
        category: "Archival"
    },
    {
        id: "6",
        title: "March on Washington",
        year: "1963",
        source: "National Archives",
        thumbnail: "https://images.unsplash.com/photo-1569025743873-ea3a9ber?q=80&w=800",
        videoUrl: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
        isElderVerified: true,
        category: "Oral History"
    },
];

export function LegacyVault() {
    const [activeTab, setActiveTab] = useState<'cinema' | 'civil-rights' | 'archives'>('cinema');
    const [activeItem, setActiveItem] = useState<LegacyItem | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Reset playing state when item changes
    React.useEffect(() => {
        setIsPlaying(false);
    }, [activeItem]);

    // Dynamic background based on active tab
    const getTabColor = () => {
        if (activeTab === 'cinema') return 'from-yellow-600/10';
        if (activeTab === 'civil-rights') return 'from-red-900/20';
        return 'from-blue-900/20';
    };

    return (
        <div className="min-h-screen bg-transparent text-white pb-32">

            {/* HERO SELECTOR - "Netflix Style" Top Nav */}
            <div className={`sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5 transition-colors duration-700`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-black tracking-[0.2em] uppercase hidden sm:inline-block">The Vault</span>
                    </div>

                    {/* PILL NAVIGATION */}
                    <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                        <button
                            onClick={() => setActiveTab('cinema')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                                activeTab === 'cinema' ? "bg-yellow-600 text-black shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            Cinema
                        </button>
                        <button
                            onClick={() => setActiveTab('civil-rights')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                                activeTab === 'civil-rights' ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            Civil Rights
                        </button>
                        <button
                            onClick={() => setActiveTab('archives')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all",
                                activeTab === 'archives' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                        >
                            Archives
                        </button>
                    </div>
                </div>
            </div>

            {/* DYNAMIC HERO BACKGROUND */}
            <div className={`fixed inset-0 bg-gradient-to-b ${getTabColor()} to-transparent opacity-50 pointer-events-none transition-colors duration-1000`} />

            {/* MAIN CONTENT AREA */}
            <div className="max-w-[1600px] mx-auto pt-8 px-0 sm:px-8">

                {activeTab === 'cinema' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Integrated Component */}
                        <BlackCinemaGallery />
                    </div>
                )}

                {activeTab === 'civil-rights' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Integrated Component */}
                        <CivilRightsGallery />
                    </div>
                )}

                {activeTab === 'archives' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 px-4 sm:px-0">
                        {/* ARCHIVE GRID - VISUAL OVERHAUL */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {VAULT_ITEMS.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer"
                                    onClick={() => setActiveItem(item)}
                                >
                                    {/* POSTER IMAGE */}
                                    <Image
                                        src={item.thumbnail}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder.svg";
                                        }}
                                    />

                                    {/* GRADIENT OVERLAY */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    {/* TEXT CONTENT */}
                                    <div className="absolute bottom-0 left-0 p-4 w-full">
                                        {item.isElderVerified && (
                                            <div className="inline-flex items-center space-x-1 bg-yellow-600/90 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-2">
                                                <UserCheck className="w-3 h-3" />
                                                <span>Verified</span>
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold leading-none mb-1 text-white group-hover:text-yellow-400 transition-colors drop-shadow-md">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-[10px] font-medium text-gray-300">
                                            <span>{item.year}</span>
                                            <span className="uppercase tracking-widest">{item.category}</span>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 ring-2 ring-white/0 group-hover:ring-white/20 transition-all rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL - DETAIL VIEW (For Archives) */}
            {activeItem && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 animate-in fade-in duration-300">
                    <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
                        <button
                            onClick={() => setActiveItem(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <span className="sr-only">Close</span>
                            <ArrowRight className="w-6 h-6 text-white rotate-180" />
                        </button>

                        {/* LEFT: MEDIA PLAYER OR IMAGE */}
                        <div className="w-full md:w-1/2 aspect-video md:aspect-auto relative bg-zinc-900 group">
                            {isPlaying ? (
                                <video
                                    src={activeItem.videoUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain bg-black"
                                />
                            ) : (
                                <>
                                    <Image
                                        src={activeItem.thumbnail}
                                        alt={activeItem.title}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "/placeholder.svg";
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={() => setIsPlaying(true)}
                                            className="p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:scale-110 hover:bg-yellow-600 hover:text-black hover:border-transparent transition-all cursor-pointer group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                                        >
                                            <Play className="w-8 h-8 fill-current" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* RIGHT: DETAILS */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 text-yellow-600 mb-4 text-xs font-black uppercase tracking-widest">
                                <Film className="w-4 h-4" />
                                <span>{activeItem.category}</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{activeItem.title}</h2>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                A curated selection from the {activeItem.source} collection. Restored and digitized for the JuneteenthTube archives. verified by community elders for historical accuracy.
                            </p>

                            <div className="flex items-center space-x-4 mb-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase text-gray-600 font-bold">Year</span>
                                    <span className="text-white font-mono">{activeItem.year}</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase text-gray-600 font-bold">Verified By</span>
                                    <span className="text-white">{activeItem.isElderVerified ? "Elder Council" : "Pending"}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsPlaying(true)}
                                className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>{isPlaying ? "Using Player Controls" : "Start Playback"}</span>
                                {!isPlaying && <Play className="w-4 h-4 fill-current" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
