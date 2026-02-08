"use client";

import { FreedomMap } from "@/components/interactive/FreedomMap";
import Image from "next/image";
import { PlayCircle, Vault } from "lucide-react";

export default function FreedomMapPage() {
    return (
        <div className="min-h-screen bg-[#0d0d0d] text-[#fdfaf6] -m-4 md:-m-8">
            {/* Nav - Keep existing app structure but style like snippet if it were there */}
            {/* Note: In a real app, this would be handled by a Layout component, 
                but we match the snippet's feel here */}

            <main className="max-w-7xl mx-auto px-6 py-12">
                <FreedomMap />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2">
                        <h3 className="text-3xl font-bold mb-8 flex items-center">
                            <Vault className="mr-4 text-yellow-600 w-8 h-8" />
                            <span className="font-serif italic">Legacy Vault</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Vault Item 1 */}
                            <div className="snippet-glass p-5 rounded-3xl group cursor-pointer hover:border-yellow-600/30 transition duration-500">
                                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black mb-5">
                                    <Image
                                        src="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=600"
                                        fill
                                        className="object-cover opacity-60 group-hover:scale-110 transition duration-700"
                                        alt="The Tulsa Chronicles"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition">
                                            <PlayCircle className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[9px] font-bold tracking-widest text-yellow-500 uppercase px-3 py-1 rounded-full border border-yellow-500/20">
                                        Verified Elder Interview
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold px-2">The Tulsa Chronicles: Part 1</h4>
                                <p className="text-xs text-gray-500 mt-2 px-2 uppercase tracking-widest">Sponsored by Chase DEI</p>
                            </div>

                            {/* Vault Item 2 */}
                            <div className="snippet-glass p-5 rounded-3xl group cursor-pointer hover:border-yellow-600/30 transition duration-500">
                                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black mb-5">
                                    <Image
                                        src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=600"
                                        fill
                                        className="object-cover opacity-60 group-hover:scale-110 transition duration-700"
                                        alt="Harlem Fest Architecture"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition">
                                            <PlayCircle className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[9px] font-bold tracking-widest text-yellow-500 uppercase px-3 py-1 rounded-full border border-yellow-500/20">
                                        Archival Footage
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold px-2">Harlem Freedom: 1969</h4>
                                <p className="text-xs text-gray-500 mt-2 px-2 uppercase tracking-widest">Sponsored by Target</p>
                            </div>
                        </div>
                    </div>

                    <div className="snippet-glass p-10 rounded-[2.5rem] border-yellow-900/20 bg-gradient-to-br from-yellow-900/10 to-transparent flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-2xl font-black mb-6 uppercase italic leading-tight">The #FreedomStory Stitch</h3>
                            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                                Connect your legacy with ours. Respond to today&apos;s prompt to be featured on the map.
                            </p>
                            <div className="p-6 bg-black/60 rounded-2xl mb-8 italic text-sm border-l-4 border-red-700 shadow-inner">
                                &quot;What piece of family history will you never let go of?&quot;
                            </div>
                        </div>
                        <button className="w-full py-5 rounded-2xl bg-legacy-red text-white font-bold hover:bg-red-700 transition shadow-xl shadow-red-900/40 uppercase tracking-widest text-sm active:scale-95 transition-transform">
                            STITCH NOW
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
