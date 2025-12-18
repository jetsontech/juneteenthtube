"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                alert('Success! Please check your email for the confirmation link.');
                onClose();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {mode === 'login' ? 'Sign in to your Juneteenth Tube account' : 'Join the celebration of freedom'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Close"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleAuth} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {mode === 'signup' && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-j-gold transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-j-gold transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-j-gold transition-colors"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-j-gold hover:bg-yellow-600 disabled:bg-yellow-600/50 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/10 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>

                    <div className="text-center mt-6">
                        <p className="text-gray-400 text-sm">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className="text-j-gold font-semibold ml-1 hover:underline"
                            >
                                {mode === 'login' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </form>

                {/* Footer Info */}
                <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        Celebrating Freedom Since 1865
                    </p>
                </div>
            </div>
        </div>
    );
}
