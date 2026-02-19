"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function VaultSplash({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState<"studios" | "presents" | "reveal" | "exit">("studios");

    useEffect(() => {
        // Timeline:
        // 0.0s: STUDIOS (Slam)
        // 1.5s: PRESENTS (Fade)
        // 3.0s: REVEAL (Explosion/Zoom)
        // 7.0s: EXIT
        // 8.0s: Unmount

        const timer1 = setTimeout(() => setPhase("presents"), 1500);
        const timer2 = setTimeout(() => setPhase("reveal"), 3000);
        const timer3 = setTimeout(() => setPhase("exit"), 7000);
        const timer4 = setTimeout(onComplete, 8000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [onComplete]);

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-black overflow-hidden transition-opacity duration-1000",
            phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
            {/* GLOBAL FX: Film Grain Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-20 mix-blend-overlay">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-pulse" />
            </div>

            {/* PHASE 0: STUDIOS (The "Netflix/Marvel" Style Intro) */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-black z-40 transition-opacity duration-500",
                phase === "studios" ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <div className="relative overflow-hidden">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-400 to-gray-800 animate-[shake_0.5s_ease-in-out] scale-150">
                        JUNETEENTH
                    </h1>
                    <span className="block text-right text-xs md:text-sm font-bold tracking-[1em] text-red-600/80 uppercase mt-2 animate-in slide-in-from-left duration-1000">
                        STUDIOS
                    </span>
                    {/* Light Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_1s_infinite]" />
                </div>
            </div>

            {/* PHASE 1: PRESENTS */}
            <div className={cn(
                "absolute inset-0 flex flex-col items-center justify-center bg-black z-30 transition-all duration-1000",
                phase === "presents" ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"
            )}>
                <div className="space-y-4 text-center">
                    <h1 className="text-2xl md:text-4xl font-serif italic text-yellow-500/90 tracking-widest animate-in fade-in zoom-in duration-[1500ms]">
                        PRESENTS
                    </h1>
                </div>
            </div>

            {/* PHASE 2: THE BLOCKBUSTER REVEAL */}
            <div className={cn(
                "absolute inset-0 z-20 transition-all duration-1000",
                (["studios", "presents"].includes(phase)) ? "opacity-0" : "opacity-100"
            )}>
                {/* 1. BACKGROUND: Deep Zoom & Color Grade */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className={cn(
                        "relative w-full h-full transition-transform duration-[10s] cubic-bezier(0.25, 1, 0.5, 1)", // Custom ease for "impact"
                        phase === "reveal" ? "scale-100 translate-y-0" : "scale-125 translate-y-10"
                    )}>
                        <img
                            src="/legacyvaulpic.JPG"
                            alt="Legacy Vault"
                            className="w-full h-full object-cover opacity-60 filter contrast-125 saturate-150 brightness-75"
                        />
                        {/* Vignette */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000000_100%)] opacity-80" />
                    </div>
                </div>

                {/* 2. ATMOSPHERE: Embers & God Rays */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {/* Embers (CSS only simulation via noise/gradients for now, complex particle systems need canvas) */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent mix-blend-color-dodge opacity-50 animate-pulse" />
                </div>

                {/* 3. TITLES: Metallic 3D Impact */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40" style={{ perspective: "1000px" }}>
                    {/* "LEGACY" - Rising from darkness */}
                    <div className="relative overflow-hidden mb-[-2vw] mix-blend-overlay">
                        <h1 className={cn(
                            "text-[12vw] md:text-[10vw] font-black tracking-tighter text-transparent stroke-text-white/20 transition-all duration-[3000ms] ease-out",
                            phase === "reveal" ? "translate-y-[-20%] opacity-40 scale-100" : "translate-y-[20%] opacity-0 scale-90"
                        )}
                            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
                            LEGACY
                        </h1>
                    </div>

                    {/* "THE VAULT" - SLAM IMPACT */}
                    <div className={cn(
                        "absolute transform transition-all duration-[800ms] cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Back-out easing (bounce)
                        phase === "reveal" ? "scale-100 opacity-100" : "scale-[2] opacity-0"
                    )}>
                        <h1 className="text-[10vw] md:text-[8vw] font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#bf953f] to-[#b38728] drop-shadow-[0_10px_30px_rgba(255,215,0,0.5)] filter brightness-125 animate-[shake_0.5s_ease-out_0.5s]">
                            THE VAULT
                        </h1>
                        {/* Shine reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/80 to-transparent -skew-x-12 translate-x-[-200%] animate-[shimmer_3s_infinite_2s]" />
                    </div>
                </div>

                {/* 4. CINEMATIC BARS */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-[10vh] bg-black z-50 transition-all duration-[1000ms] ease-out delay-500",
                    phase === "reveal" ? "translate-y-0" : "-translate-y-full"
                )} />
                <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-[10vh] bg-black z-50 transition-all duration-[1000ms] ease-out delay-500",
                    phase === "reveal" ? "translate-y-0" : "translate-y-full"
                )} />
            </div>
        </div>
    );
}

// Add these keyframes to your globals.css if not present, or rely on Tailwind utility hacks
// For simplicity here, sticking to standard Tailwind animation utilities where possible.
