"use client";

import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";

/**
 * Smart Install Banner — appears for mobile users after a short delay,
 * prompting them to add the app to their home screen for an immersive,
 * edge-to-edge experience. Dismissed permanently via localStorage.
 */
export function InstallBanner() {
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Don't show if already installed as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        // @ts-expect-error - navigator.standalone is iOS-specific
        if (window.navigator.standalone === true) return;

        // Don't show if already dismissed
        if (localStorage.getItem('install_banner_dismissed')) return;

        // Only show on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
        setIsAndroid(/Android/i.test(navigator.userAgent));

        // Show after 8 seconds of browsing
        const timer = setTimeout(() => setShow(true), 8000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setShow(false);
        localStorage.setItem('install_banner_dismissed', 'true');
    };

    if (!show) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[90] animate-slideUp install-banner-safe"
        >
            <div className="mx-3 mb-3 rounded-2xl glass-heavy overflow-hidden shadow-2xl border border-white/10">
                <div className="px-4 py-3 flex items-center gap-3">
                    {/* App Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006B3D] via-[#E31C23] to-[#FFD700] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white font-black text-lg">J</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">Get the Full Experience</p>
                        <p className="text-gray-400 text-xs mt-0.5 leading-tight">
                            {isIOS
                                ? "Tap Share → Add to Home Screen"
                                : "Tap ⋮ Menu → Install App"
                            }
                        </p>
                    </div>

                    {/* Icon hint */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {isIOS ? (
                            <div className="flex items-center gap-1 text-[#3ea6ff] text-xs font-medium">
                                <Share className="w-4 h-4" />
                                <span>Share</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[#3ea6ff] text-xs font-medium">
                                <Plus className="w-4 h-4" />
                                <span>Install</span>
                            </div>
                        )}
                    </div>

                    {/* Close */}
                    <button
                        onClick={dismiss}
                        className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Dismiss install banner"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
