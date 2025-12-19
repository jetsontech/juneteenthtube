"use client";

import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleUnlock = (e?: React.FormEvent) => {
        e?.preventDefault();
        // Updated access code: JTA2026
        if (accessCode.toUpperCase() === 'JTA2026') {
            setIsExiting(true);
            setTimeout(() => {
                localStorage.setItem('guest_access_granted', 'true');
                onUnlock();
            }, 800);
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
        }
    };

    return (
        <div className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] transition-all duration-1000 ease-in-out overflow-hidden",
            isExiting ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
        )}>
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-green-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 pointer-events-none" />

            {/* Content Container */}
            <div className={cn(
                "relative z-10 w-full max-w-md px-8 py-12 transition-all duration-1000 delay-300 transform",
                isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            )}>
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Logo/Icon Section */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-[#222] to-[#000] border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
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

                    <form onSubmit={handleUnlock} className="w-full space-y-4">
                        <div className="relative group">
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="ENTER ACCESS CODE"
                                className={cn(
                                    "w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-center text-lg tracking-[0.3em] font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-md",
                                    error && "border-red-500/50 shake ring-2 ring-red-500/20"
                                )}
                                autoFocus
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/40 transition-colors">
                                <Lock size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group relative w-full bg-white text-black font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-white/10"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Access Platform <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    </form>

                    <div className="pt-4 border-t border-white/5 w-full">
                        <p className="text-white/20 text-[10px] tracking-widest uppercase font-bold">
                            © 2026 Net Post Media, llc • Restricted Access
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .shake {
                    animation: shake 0.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
