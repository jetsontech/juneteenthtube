"use client";

import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundSystem } from './BackgroundSystem';

interface LoginSplashProps {
    onUnlock: () => void;
}

export const LoginSplash: React.FC<LoginSplashProps> = ({ onUnlock }) => {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [phase, setPhase] = useState<'gate' | 'welcome'>('gate');

    useEffect(() => {
        setTimeout(() => setIsLoaded(true), 100);
    }, []);

    const handleUnlock = (e?: React.FormEvent) => {
        e?.preventDefault();
        const validCode = process.env.NEXT_PUBLIC_GATEWAY_CODE || '9999';
        if (accessCode === validCode) {
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
        window.open('https://juneteenthtube.vercel.app', '_blank');
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] transition-all duration-1000 ease-in-out overflow-hidden",
            isExiting ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
        )}>
            {/* Shared Background System */}
            <BackgroundSystem />

            {/* Content Container */}
            <div className={cn(
                "relative z-10 w-full max-w-lg px-8 py-12 transition-all duration-1000 delay-300 transform",
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            )}>
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Logo/Icon Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-[#222] to-[#000] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl transition-transform hover:scale-105 duration-500">
                            <Play className="w-10 h-10 text-white fill-white" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                            JUNETEENTH<span className="text-red-600">TUBE</span>
                        </h1>
                        <div className="flex flex-col gap-1">
                            <p className="text-white/40 font-medium text-xs tracking-[0.2em] uppercase italic">
                                Official Media Gateway
                            </p>
                            <p className="text-white/25 font-bold text-[9px] tracking-[0.3em] uppercase">
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
                                        "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-center text-lg tracking-[0.3em] font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-md",
                                        error && "border-red-500/50 animate-[shake_0.2s_ease-in-out_infinite] ring-2 ring-red-500/20"
                                    )}
                                    autoFocus
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors">
                                    <Lock size={18} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="group relative w-full bg-white text-black font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-white/10 overflow-hidden"
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
                                                WELCOME TO JUNETEENTHTUBE • ACCESS GRANTED • 2026 MEDIA GATEWAY •
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
                                    className="group relative bg-white/[0.05] border border-white/10 text-white font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] hover:bg-white/[0.1] active:scale-[0.98] backdrop-blur-md"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        Subscribe <Play size={14} className="fill-current" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5 w-full">
                        <p className="text-white/20 text-[10px] tracking-widest uppercase font-bold text-center">
                            © 2026 Net Post Media, llc • Restricted Access
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
