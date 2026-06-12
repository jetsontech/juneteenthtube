"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginSplashProps {
    onUnlock: () => void;
}

export const LoginSplash: React.FC<LoginSplashProps> = ({ onUnlock }) => {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [phase, setPhase] = useState<'gate' | 'welcome'>('gate');
    const [videoReady, setVideoReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        setTimeout(() => setIsLoaded(true), 100);
    }, []);

    const handleUnlock = (e?: React.FormEvent) => {
        e?.preventDefault();
        const inputCode = accessCode.trim();
        // Priority: Env Var > Hardcoded Fallback
        const validCode = process.env.NEXT_PUBLIC_GATEWAY_CODE || '1318';

        console.log(`[Gateway] Validation Attempt:`);
        console.log(`- Input: "${inputCode}"`);
        console.log(`- Expected Source: ${process.env.NEXT_PUBLIC_GATEWAY_CODE ? 'ENV_VAR' : 'FALLBACK'}`);
        console.log(`- Match: ${inputCode === validCode}`);

        if (inputCode === validCode) {
            setPhase('welcome');
            sessionStorage.setItem('guest_access_granted', 'true');
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
        }
    };

    const handleFinalEnter = () => {
        setIsExiting(true);
        setTimeout(() => {
            sessionStorage.setItem('guest_access_granted', 'true');
            onUnlock();
        }, 800);
    };

    const handleSubscribe = () => {
        window.open('https://culturequest.vip', '_blank');
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] transition-all duration-1000 ease-in-out overflow-hidden",
            isExiting ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
        )}>
            {/* CQ4 Video Background */}
            <video
                ref={videoRef}
                src="/cq4.mp4"
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => setVideoReady(true)}
                className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
                    videoReady ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Dark overlay gradient over video */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 pointer-events-none" />
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Vignette edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

            {/* Content Container */}
            <div className={cn(
                "relative z-10 w-full max-w-lg px-8 py-12 transition-all duration-1000 delay-300 transform",
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            )}>
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Logo/Icon Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-[#1a0000] to-[#000] border border-red-900/40 flex items-center justify-center shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 duration-500">
                            <Play className="w-10 h-10 text-red-500 fill-red-500" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl drop-shadow-2xl">
                            CULTURE<span className="text-red-600">QUEST</span>
                        </h1>
                        <div className="flex flex-col gap-1">
                            <p className="text-white/60 font-medium text-xs tracking-[0.2em] uppercase italic">
                                Official Media Gateway
                            </p>
                            <p className="text-white/35 font-bold text-[9px] tracking-[0.3em] uppercase">
                                Provided by Net Post Media, llc
                            </p>
                        </div>
                    </div>

                    {phase === 'gate' ? (
                        <form onSubmit={handleUnlock} className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="ENTER ACCESS CODE"
                                    className={cn(
                                        "w-full bg-black/40 border border-white/15 rounded-2xl px-6 py-4 text-center text-lg tracking-[0.3em] font-bold text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-red-600/40 transition-all backdrop-blur-md",
                                        error && "border-red-500/50 animate-[shake_0.2s_ease-in-out_infinite] ring-2 ring-red-500/20"
                                    )}
                                    autoFocus
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-red-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="group relative w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-red-900/30 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Unlock Gateway <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </span>
                            </button>
                        </form>
                    ) : (
                        <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
                            {/* Green Digital Marquee */}
                            <div className="relative w-full overflow-hidden bg-black/80 border border-green-500/30 rounded-xl py-4 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                <div className="marquee-container flex whitespace-nowrap">
                                    <div className="flex gap-8 items-center animate-[marquee_20s_linear_infinite]">
                                        {[...Array(4)].map((_, i) => (
                                            <span key={i} className="text-green-500 font-mono text-xl font-bold tracking-[0.3em] uppercase">
                                                WELCOME TO CULTUREQUEST • ACCESS GRANTED • 2026 MEDIA GATEWAY •
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black via-transparent to-black opacity-60" />
                                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(rgba(0,0,0,0)_0px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0)_4px)]" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={handleFinalEnter}
                                    className="group relative bg-green-500 text-black font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] hover:bg-green-400 active:scale-[0.98] shadow-lg shadow-green-500/20"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Access Platform <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </span>
                                </button>
                                <button
                                    onClick={handleSubscribe}
                                    className="group relative bg-white/[0.08] border border-white/15 text-white font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] hover:bg-white/[0.15] active:scale-[0.98] backdrop-blur-md"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Subscribe <Play size={14} className="fill-current" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/10 w-full">
                        <p className="text-white/25 text-[10px] tracking-widest uppercase font-bold text-center">
                            © 2026 Net Post Media, llc • Restricted Access
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
