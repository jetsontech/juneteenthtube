"use client";

import React, { useState } from "react";
import { ShieldCheck, Search, Play, Info, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegacyItem {
    id: string;
    title: string;
    description: string;
    year: string;
    author: string;
    thumbnail: string;
    isElderVerified: boolean;
    category: "Oral History" | "Documentary" | "Performance" | "Archival";
}

const VAULT_ITEMS: LegacyItem[] = [
    {
        id: "1",
        title: "The Spirit of 1865",
        description: "A deep dive into the first Juneteenth celebrations in Galveston, featuring rare archival footage and family narratives.",
        year: "1924 (Restored)",
        author: "Heritage Preservation Society",
        thumbnail: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=800",
        isElderVerified: true,
        category: "Oral History"
    },
    {
        id: "2",
        title: "Buffalo Soldiers Legacy",
        description: "An interactive exploration of the connection between the Buffalo Soldiers and the expansion of Juneteenth traditions westwards.",
        year: "2023",
        author: "Col. Thomas Richardson (Ret.)",
        thumbnail: "https://images.unsplash.com/photo-1526857240824-92be52581d9f?q=80&w=800",
        isElderVerified: true,
        category: "Archival"
    },
    {
        id: "3",
        title: "Sweet Auburn: A Sonic Journey",
        description: "Experiencing the evolution of Gospel and Jazz through the lens of Atlanta's most historic street.",
        year: "2024",
        author: "Atlanta Music Collective",
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
        isElderVerified: false,
        category: "Performance"
    },
];

export function LegacyVault() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = ["Oral History", "Documentary", "Performance", "Archival"];

    const filteredItems = VAULT_ITEMS.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white p-8 animate-in fade-in duration-700">
            {/* VAULT HEADER */}
            <div className="max-w-7xl mx-auto mb-16 text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border-yellow-600/30 mb-6">
                    <ShieldCheck className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-yellow-500 uppercase">Community Certified Archive</span>
                </div>
                <h1 className="text-7xl font-serif italic mb-6">The Legacy Vault</h1>
                <p className="max-w-2xl mx-auto text-gray-400 text-lg">
                    Preserving the authentic narratives of freedom through decentralized community verification.
                </p>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-500 transition" />
                    <input
                        type="search"
                        placeholder="Search the archives..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-yellow-600/50 transition-all font-light"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-3 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                            "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                            !selectedCategory ? "bg-yellow-600 text-black shadow-lg shadow-yellow-600/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                selectedCategory === cat ? "bg-yellow-600 text-black shadow-lg shadow-yellow-600/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* VAULT GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="group relative glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-yellow-600/30 transition-all duration-500 flex flex-col h-full active:scale-[0.98]"
                    >
                        {/* Thumbnail Wrap */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent opacity-80" />

                            {/* ELDER VERIFIED BADGE */}
                            {item.isElderVerified && (
                                <div className="absolute top-6 left-6 flex items-center space-x-2 bg-yellow-600 text-black px-4 py-1.5 rounded-full shadow-2xl animate-in slide-in-from-left-4 duration-500">
                                    <UserCheck className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Elder Verified</span>
                                </div>
                            )}

                            {/* Play Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="p-5 bg-yellow-600 text-black rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                                    <Play className="w-8 h-8 fill-current" />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col flex-grow">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] text-yellow-600 font-black tracking-widest uppercase">{item.category}</span>
                                <div className="flex items-center space-x-1 text-gray-500 text-[10px]">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.year}</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-serif italic mb-4 group-hover:text-yellow-500 transition-colors">{item.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed font-light mb-8 line-clamp-3">
                                {item.description}
                            </p>

                            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 italic">By {item.author}</span>
                                <button className="text-xs font-black uppercase tracking-widest text-white hover:text-yellow-500 transition-colors flex items-center space-x-2 group/btn">
                                    <span>Access Artifact</span>
                                    <Info className="w-4 h-4 text-gray-600 group-hover/btn:text-yellow-600 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EMPTY STATE */}
            {filteredItems.length === 0 && (
                <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                    <Search className="w-12 h-12 text-gray-700 mx-auto mb-6" />
                    <h3 className="text-2xl font-serif italic text-gray-500">No results found in the archives.</h3>
                    <p className="text-gray-600 mt-2">Try adjusting your filters or search query.</p>
                </div>
            )}
        </div>
    );
}
