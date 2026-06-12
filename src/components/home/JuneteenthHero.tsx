"use client";

import { useState } from "react";
import Link from "next/link";
import { FireworksCanvas } from "./FireworksCanvas";

interface JuneteenthHeroProps {
    totalArchives?: number;
}

export function JuneteenthHero({ totalArchives = 48 }: JuneteenthHeroProps) {
    const [bannerTilt, setBannerTilt] = useState<React.CSSProperties>({});

    const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const banner = e.currentTarget;
        const rect = banner.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((centerY - y) / centerY) * 6;
        const rotateY = ((x - centerX) / centerX) * 6;
        
        setBannerTilt({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`,
            transition: "transform 0.05s ease-out"
        });
    };

    const handleBannerMouseLeave = () => {
        setBannerTilt({
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
            transition: "transform 0.6s ease"
        });
    };

    return (
        <div className="space-y-12 sm:space-y-16">
            {/* ═══════════════════════════════════════════════════════════════
                ★  JUNETEENTH — 1865  ★  CINEMATIC HERO BANNER
                ═══════════════════════════════════════════════════════════════ */}
            <div 
                onMouseMove={handleBannerMouseMove}
                onMouseLeave={handleBannerMouseLeave}
                style={bannerTilt}
                className="jt-cinematic-banner relative overflow-hidden rounded-3xl border border-amber-500/20 bg-black cursor-pointer group"
            >
                {/* ── Animated Star Field Background ── */}
                <div className="jt-stars absolute inset-0 pointer-events-none" />
                <div className="jt-stars jt-stars-2 absolute inset-0 pointer-events-none" />

                {/* ── Fireworks Canvas ── */}
                <FireworksCanvas />

                {/* ── Cinematic Vignette Overlay ── */}
                <div className="absolute inset-0 pointer-events-none z-[1]"
                    style={{
                        background: `
                            radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.08) 0%, transparent 55%),
                            radial-gradient(ellipse at 20% 80%, rgba(229,9,20,0.04) 0%, transparent 40%),
                            radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 40%),
                            linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)
                        `
                    }}
                />

                {/* ── Horizontal Scanline Texture ── */}
                <div className="absolute inset-0 pointer-events-none z-[2] opacity-[0.03]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)`,
                    }}
                />

                {/* ── Lens Flare / Anamorphic Streak ── */}
                <div className="jt-lens-flare absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[2px] pointer-events-none z-[3]" />

                {/* ── Main Content ── */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-16 sm:py-24 lg:py-32 px-6 sm:px-12 pointer-events-none">

                    {/* Eyebrow Badge */}
                    <div className="jt-badge-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-amber-400/80">
                            Celebrating Freedom
                        </span>
                    </div>

                    {/* ── Title Block ── */}
                    <h2 className="jt-title-reveal mb-2">
                        <span className="block text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
                            <span className="jt-glow-gold">Juneteenth</span>
                        </span>
                    </h2>

                    {/* Gold Shimmer Divider */}
                    <div className="jt-divider-reveal flex items-center gap-4 my-5 sm:my-6">
                        <div className="jt-shimmer-line h-[1px] w-16 sm:w-24" />
                        <span className="text-amber-500/60 text-lg sm:text-xl font-thin tracking-[0.5em]">★</span>
                        <div className="jt-shimmer-line h-[1px] w-16 sm:w-24" />
                    </div>

                    {/* Date — Dramatic Reveal */}
                    <div className="jt-date-reveal">
                        <span className="block text-sm sm:text-base font-light tracking-[0.4em] uppercase text-white/40 mb-2">
                            June 19th
                        </span>
                        <span className="jt-glow-red block text-6xl sm:text-8xl lg:text-9xl font-black tracking-[-0.04em] leading-none">
                            1865
                        </span>
                    </div>

                    {/* Tagline with subtle glow pulse */}
                    <p className="jt-tagline-reveal max-w-xl mt-8 sm:mt-10 text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed font-light">
                        <span className="text-white/80 font-medium">The day freedom was proclaimed.</span>
                        <br />{" "}
                        On June 19, 1865, Union soldiers arrived in
                        <span className="text-amber-400/90 font-medium"> Galveston, Texas</span>
                        — announcing that all enslaved people were free, over two years after the Emancipation Proclamation.
                    </p>
                    <p className="jt-tagline-reveal max-w-lg mt-4 text-xs sm:text-sm text-white/30 leading-relaxed font-medium uppercase tracking-widest" style={{ animationDelay: '1.25s' }}>
                        Culture · History · Music · Stories
                    </p>

                    {/* CTA Button — Premium Glass */}
                    <div className="jt-cta-reveal mt-10 sm:mt-12">
                        <Link
                            href="/explore"
                            className="jt-cta-btn pointer-events-auto group/btn relative inline-flex items-center gap-3 px-10 py-4 sm:px-12 sm:py-5 rounded-full overflow-hidden"
                        >
                            <span className="jt-cta-shimmer absolute inset-0 pointer-events-none" />
                            <span className="relative z-10 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-amber-400 group-hover/btn:text-black transition-colors duration-500">
                                Explore Our History
                            </span>
                            <span className="relative z-10 text-amber-400 group-hover/btn:text-black group-hover/btn:translate-x-1 transition-all duration-500">
                                →
                            </span>
                        </Link>
                    </div>
                </div>

                {/* ── Bottom Fading Border Glow ── */}
                <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent z-10" />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ★  PLATFORM STATS — CINEMATIC TILES
                ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { value: totalArchives.toString(), label: "Videos Uploaded", icon: "📹" },
                    { value: "50", label: "States Covered", icon: "🗺️" },
                    { value: "2.1M", label: "Total Views", icon: "👁️" },
                    { value: "1865", label: "Year of Freedom", icon: "✊🏿" },
                ].map((stat, i) => (
                    <div
                        key={stat.label}
                        className="jt-stat-card group/stat relative overflow-hidden bg-black/60 border border-white/[0.06] rounded-2xl px-5 py-5 flex flex-col gap-1.5 backdrop-blur-sm hover:border-amber-500/20 transition-all duration-500"
                        style={{ animationDelay: `${1.8 + i * 0.15}s` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500" />
                        <span className="text-lg mb-0.5 opacity-60">{stat.icon}</span>
                        <span className="jt-stat-value text-amber-400 text-2xl sm:text-3xl font-black tracking-tight">{stat.value}</span>
                        <span className="text-zinc-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
