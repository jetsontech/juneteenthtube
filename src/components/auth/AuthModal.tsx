"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

// Simple localization dictionary & helper to resolve internationalization warnings
const translations = new Map<string, string>([
    ["fullName", "Full Name"],
    ["email", "Email"],
    ["password", "Password"],
    ["forgotPassword", "Forgot password?"],
    ["celebratingFreedom", "Celebrating Freedom Since 1865"]
]);

const t = (key: string) => {
    return translations.get(key) || key;
};

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (mode === 'reset') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/settings`,
                });
                if (error) throw error;
                setSuccess('Password reset link sent! Check your email.');
                return;
            }

            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`,
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                setSuccess('Account created! Check your email for the confirmation link.');
                return;
            }

            // Login
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const redirectUrl = `${window.location.origin}/`;
            console.log("[Auth] Initiating Google Sign-In with redirect URL:", redirectUrl);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });
            if (error) throw error;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to initiate Google sign-in');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setError(null);
        setSuccess(null);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-zinc-950/60 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between relative">
                    <div>
                        {mode === 'reset' && (
                            <button
                                onClick={() => { setMode('login'); resetForm(); }}
                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                Back to sign in
                            </button>
                        )}
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                            {mode === 'login'
                                ? 'Sign in to your CultureQuest account'
                                : mode === 'signup'
                                    ? 'Join the celebration of freedom'
                                    : 'Enter your email to receive a reset link'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        title="Close"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Google OAuth */}
                    {mode !== 'reset' && (
                        <>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 font-semibold py-3 rounded-xl transition-all text-sm"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px bg-white/[0.06]" />
                                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">or</span>
                                <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>
                        </>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                                {success}
                            </div>
                        )}

                        {mode === 'signup' && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-300 ml-1">{t("fullName")}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-300 ml-1">{t("email")}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        </div>

                        {mode !== 'reset' && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-300 ml-1">{t("password")}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => { setMode('reset'); resetForm(); }}
                                    className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                                >
                                    {t("forgotPassword")}
                                </button>
                            </div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
                        >
                            {loading && <Loader2 className="animate-spin" size={18} />}
                            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                        </button>

                        {mode !== 'reset' && (
                            <div className="text-center mt-4">
                                <p className="text-zinc-400 text-sm">
                                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                    <button
                                        type="button"
                                        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetForm(); }}
                                        className="text-amber-400 font-semibold ml-1 hover:underline"
                                    >
                                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">
                        {t("celebratingFreedom")}
                    </p>
                </div>
            </div>
        </div>
    );
}
