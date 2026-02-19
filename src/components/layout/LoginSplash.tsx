"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
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
        const validCode = process.env.NEXT_PUBLIC_GATEWAY_CODE || '2585';
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
                <div className="flex flex-col items-center text-center space-y-12">
                    {/* Premium Logo Section */}
                    <div className="relative group">
                        <div className="absolute -inset-8 bg-j-gold/20 rounded-full blur-3xl opacity-50 animate-pulse group-hover:opacity-70 transition-opacity duration-1000" />
                        <div className="relative">
                            <Image
                                src="/logo.svg"
                                alt="JuneteenthTube"
                                width={320}
                                height={80}
                                className="object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Status Text - Typewriter style or simple fade */}
                    <div className="space-y-2">
                        <p className="text-j-gold/80 font-medium text-[10px] tracking-[0.4em] uppercase font-mono">
                            Secure Media Gateway
                        </p>
                        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-j-gold/50 to-transparent mx-auto" />
                    </div>

                    {phase === 'gate' ? (
                        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="ENTER ACCESS CODE"
                                    className={cn(
                                        "w-full bg-black/40 border-b border-white/10 px-4 py-4 text-center text-xl tracking-[0.5em] font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-j-gold/50 focus:bg-white/[0.02] transition-all duration-300 font-mono",
                                        error && "border-red-500/50 text-red-500 animate-[shake_0.2s_ease-in-out_infinite]"
                                    )}
                                    autoFocus
                                />
                                {/* Scanning Line Effect on focus */}
                                <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-j-gold transition-all duration-500 group-focus-within:w-full" />
                            </div>

                            <button
                                type="submit"
                                className="group w-full relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <span className="relative z-10 flex items-center justify-center gap-3 text-xs font-bold tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors py-4">
                                    <Lock size={12} className="mb-0.5" /> Authenticate Access <ArrowRight size={12} className="mb-0.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </span>
                            </button>
                        </form>
                    ) : (
                        <div className="w-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                            {/* Access Granted Sequence */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-green-500 font-mono text-xs tracking-[0.5em] uppercase animate-pulse">
                                    Access Granted
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                    WELCOME TO <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] to-[#AAA]">THE VAULT</span>
                                </h2>
                            </div>

                            {/* Gold Progress Line */}
                            <div className="w-0 h-[1px] bg-j-gold animate-[width_1s_ease-out_forwards]" style={{ width: '100px' }} />

                            <div className="grid grid-cols-1 gap-4 w-full max-w-xs pt-8">
                                <button
                                    onClick={handleFinalEnter}
                                    className="group relative bg-[#D4AF37] text-black font-bold py-4 px-8 rounded-sm text-xs tracking-[0.2em] uppercase transition-all hover:bg-[#F5D061] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        Enter Platform <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                    </span>
                                </button>
                                <button
                                    onClick={handleSubscribe}
                                    className="text-white/40 hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors py-2"
                                >
                                    Subscribe for Updates
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-12 left-0 w-full text-center">
                        <p className="text-white/10 text-[9px] tracking-[0.3em] uppercase font-medium">
                            Restricted Area • Authorized Personnel Only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
