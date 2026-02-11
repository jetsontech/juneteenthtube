"use client";

import React, { useState } from "react";
import { X, Settings, Plus, MapPin } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Pin {
    id: number | string;
    city: string;
    brand: string;
    top: string;
    left: string;
    tier?: string;
    logo?: string;
    image?: string;
}

const INITIAL_PINS: Pin[] = [
    {
        id: 1,
        city: 'Atlanta, GA',
        brand: 'Chase Bank',
        top: '70%',
        left: '78%',
        tier: 'Platinum',
        logo: 'CH',
        image: "https://images.unsplash.com/photo-1524312644410-b2572e21b08c?q=80&w=800"
    },
    {
        id: 2,
        city: 'Galveston, TX',
        brand: 'Nike DEI',
        top: '75%',
        left: '55%',
        tier: 'Gold',
        logo: 'NI',
        image: "https://images.unsplash.com/photo-1561489422-45de3d015e3e?q=80&w=800"
    },
    {
        id: 3,
        city: 'New York, NY',
        brand: 'Target',
        top: '35%',
        left: '88%',
        tier: 'Silver',
        logo: 'TA',
        image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=800"
    },
];

export function FreedomMap() {
    const [pins, setPins] = useState<Pin[]>(INITIAL_PINS);
    const [activePin, setActivePin] = useState<Pin | null>(null);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    // Admin Form State
    const [newBrand, setNewBrand] = useState("");
    const [newCity, setNewCity] = useState("");
    const [newTier, setNewTier] = useState("Gold");

    const deploySponsor = () => {
        if (!newBrand || !newCity) {
            alert("Please fill in Brand and City");
            return;
        }

        const newPin: Pin = {
            id: Date.now(),
            city: newCity,
            brand: newBrand,
            logo: newBrand.substring(0, 2).toUpperCase(),
            // Keeps pins in the "lower/central US" area as per snippet logic
            top: `${Math.floor(Math.random() * 40) + 30}%`,
            left: `${Math.floor(Math.random() * 50) + 25}%`,
            tier: newTier,
            image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=800"
        };

        setPins([...pins, newPin]);
        alert(`Sponsorship deployed for ${newBrand}!`);

        setNewBrand("");
        setNewCity("");
        setIsAdminOpen(false);
    };

    return (
        <div className="mb-20 relative">
            {/* Header info */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-5xl font-serif italic">The Freedom Map</h2>
                    <p className="text-gray-500 mt-2">Live coverage from the heart of the celebration.</p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-green-500 font-bold">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>142 STREAMS LIVE NOW</span>
                </div>
            </div>

            {/* MAIN MAP WRAPPER (STEP 170 STYLE) */}
            <div className="relative w-full h-[600px] bg-[#0d0d0d] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">

                {/* STEP 170 TYPOGRAPHY OVERLAY (Ghost Watermark) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <h1 className="text-[150px] font-black italic opacity-[0.02] text-[#d4af37] tracking-[2rem]">
                        USA
                    </h1>
                </div>

                {/* MAP SVG CONTAINER (Direct Path for 100% Reliability) */}
                <div className="absolute inset-0 p-12 opacity-[0.07] pointer-events-none">
                    <svg viewBox="0 0 959 593" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path d="M151 511l-5-5-17 5-15-12-11 1-3-12-14-6-2-12-12-5v-10l-12-5-3-11-13-1-3-12-11-1-3-12-12-5-10-1-3-13-11-1-1-12-13-2-2-11-12-3-4-12-16-1-1-12-10-6-3-11-12-6-5-12-11-6-7-13-10-7-9-12-5-13-4-12-2-12 5-12 11-11 15-9 14-8 11-12 11-11 14-8 15-9 11-11 5-12 11-11 14-8 15-9 11-11 5-12 11-11 14-8 15-9 11-11 5-12 12-11 13-1 11-12 3-11 12-5 13-1 12-3 11-2 13-1 12-3 11-2 13-1 12-3 11-2 13-1 12-3 11-2 13 1 12 3 11 4 12 5 13 7 11 6 12 5 13 4 12 2 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12 5 11 4 13 3 12 1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 10-1 4-13 1-12 1-13 1-12 1-13 1-12 1-13 1-12-1-13-1-12-1-13-1-12-2-12-4-13-5-12-6-13-7-12-8-11-9-12-10-11-12-10-13-9-12-10-11-12-10-13-9-12-10-11-12-10-13-9-12-10-11-12-10-13 9 12 10 11 12 10 13 9 12 10 11 12 10 13 9 12 10 11 12 10 13 9 12 10 11 12 10 13 9 12 10 11 12 10 13-9-12-10-11-12-10-13-9-12-10-11-12-10-13-9-12-10-11-12-10-13-9-12-10-11-12-10-13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1 13-1 12-2 13-4 12-5 11-6 13-7 12-5 11-4 13-3 12-1 13 1 12 2 13 4 12 5 11 6 13 7 12 5 11 4 13 3 12 1" fill="currentColor" className="text-[#d4af37]" />
                    </svg>
                </div>

                {/* DYNAMIC STEP 170 PINS */}
                {pins.map((pin) => (
                    <div
                        key={pin.id}
                        className="absolute group cursor-pointer z-10 pin-position"
                        ref={(el) => {
                            if (el) {
                                el.style.setProperty('--pin-top', pin.top);
                                el.style.setProperty('--pin-left', pin.left);
                            }
                        }}
                        onClick={() => setActivePin(pin)}
                        role="button"
                        title={pin.city}
                    >
                        {/* Outer Pulse (Step 170) */}
                        <div className="absolute -inset-2 bg-[#d4af37] rounded-full animate-snippet-pulse opacity-50" />

                        {/* Inner Core (Step 170) */}
                        <div className="relative w-5 h-5 bg-[#d4af37] border-2 border-white rounded-full shadow-[0_0_15px_#d4af37]" />

                        {/* Hover Label (Step 170 glass) */}
                        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 glass px-3 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-none">
                            <span className="font-bold text-yellow-500">{pin.brand}</span> • {pin.city}
                        </div>
                    </div>
                ))}
            </div>

            {/* ADMIN TOGGLE (Step 170 Gears) */}
            <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="fixed bottom-10 right-10 bg-white/5 backdrop-blur-md p-4 rounded-full hover:bg-white/10 transition-all z-[299] border border-white/10 group shadow-lg shadow-black/50"
                title="Toggle Admin Control Center"
            >
                <Settings className={cn("w-6 h-6 text-yellow-600 transition-transform duration-500", isAdminOpen && "rotate-90")} />
            </button>

            {/* ADMIN PANEL (Step 170 layout merged with tiered selection) */}
            {isAdminOpen && (
                <div className="fixed bottom-24 right-10 z-[300] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="snippet-glass p-8 rounded-[2.5rem] w-80 border-yellow-600/50 shadow-2xl backdrop-blur-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-yellow-500" />
                                <h3 className="text-xs font-black tracking-[0.2em] text-yellow-500 uppercase">Sponsor Manager</h3>
                            </div>
                            <button
                                onClick={() => setIsAdminOpen(false)}
                                className="text-gray-500 hover:text-white transition"
                                title="Close Sponsor Manager"
                                aria-label="Close Sponsor Manager"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <input
                                placeholder="Brand Name"
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:border-yellow-600/50 outline-none transition"
                                value={newBrand}
                                onChange={(e) => setNewBrand(e.target.value)}
                            />
                            <input
                                placeholder="City/Location"
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:border-yellow-600/50 outline-none transition"
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                            />
                            <select
                                value={newTier}
                                onChange={(e) => setNewTier(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm focus:border-yellow-600/50 outline-none transition appearance-none cursor-pointer"
                                title="Sponsorship Tier"
                            >
                                <option value="Platinum">Platinum (National)</option>
                                <option value="Gold">Gold (Regional)</option>
                                <option value="Silver">Silver (Local Ally)</option>
                            </select>
                            <button
                                onClick={deploySponsor}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] mt-4 transition shadow-lg shadow-yellow-600/20 flex items-center justify-center space-x-2 group active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Deploy to Map</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL POPUP (Stage 2 Platform logic) */}
            {activePin && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="max-w-2xl w-full glass rounded-[3rem] overflow-hidden shadow-2xl border-white/10 animate-in zoom-in-95 duration-300">
                        <div className="relative aspect-video">
                            <Image
                                src={activePin.image || ""}
                                fill
                                className="object-cover"
                                alt={activePin.brand || "Pin details"}
                            />
                            <button
                                onClick={() => setActivePin(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition"
                                title="Close Details"
                                aria-label="Close Details"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="absolute top-6 left-6 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                <span>LIVE</span>
                            </div>
                        </div>
                        <div className="p-10">
                            <div className="text-yellow-600 text-[10px] font-black tracking-[0.3em] uppercase mb-2">
                                {activePin.city}
                            </div>
                            <h2 className="text-4xl font-serif italic mb-6 text-white">{activePin.brand} Freedom Celebration</h2>

                            <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black font-black text-[12px]">
                                        {activePin.logo || activePin.brand.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Community Sponsor</p>
                                        <p className="sponsor-gradient font-bold">{activePin.brand}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-bold text-yellow-600/50 uppercase tracking-widest mb-1">{activePin.tier || 'Legacy Partner'}</span>
                                    <button className="bg-white hover:bg-yellow-500 transition text-black text-[10px] font-black px-6 py-3 rounded-lg uppercase tracking-wider">
                                        VIEW PARTNER
                                    </button>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-4 rounded-xl bg-legacy-red text-white font-bold hover:bg-red-700 transition shadow-lg shadow-red-900/20 uppercase tracking-widest text-sm">
                                ENTER LIVESTREAM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
