"use client";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { VideoProvider } from "@/context/VideoContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { AuthProvider } from "@/context/AuthContext";
import { StateProvider } from "@/context/StateContext";
import { LoginSplash } from "./LoginSplash";
import { BackgroundSystem } from "./BackgroundSystem";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

function ShellContent({ children }: { children: React.ReactNode }) {
    const { isOpen, toggle, setIsOpen } = useSidebar();
    const pathname = usePathname();
    const isWatchPage = pathname?.startsWith('/watch/') || pathname?.startsWith('/shorts/');

    const [isLocked, setIsLocked] = useState(true); // Default to LOCKED
    const [isChecking, setIsChecking] = useState(true); // Default to CHECKING
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

    // Gateway enabled - check sessionStorage
    useEffect(() => {
        const hasAccess = sessionStorage.getItem('guest_access_granted');
        if (hasAccess === 'true') {
            setTimeout(() => setIsLocked(false), 0);
        }
        setTimeout(() => setIsChecking(false), 0);
    }, []);

    // Lock body scroll on mobile when sidebar is open
    useEffect(() => {
        if (isOpen && window.innerWidth < 640) { // sm breakpoint
            document.body.classList.add('sidebar-open-mobile');
        } else {
            document.body.classList.remove('sidebar-open-mobile');
        }
        return () => document.body.classList.remove('sidebar-open-mobile');
    }, [isOpen]);

    // Simple Swipe Detection
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchStart.x - touchEnd;
        const diffY = touchStart.y - touchEndY;

        // Only trigger if horizontal swipe is dominant
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Swipe Right (Open) - must start near left edge if closed
            if (diffX < -50) {
                if (!isOpen && touchStart.x < 40) {
                    setIsOpen(true);
                }
            }

            // Swipe Left (Close)
            if (diffX > 50 && isOpen) {
                setIsOpen(false);
            }
        }

        setTouchStart(null);
    };

    if (isChecking) return null;

    return (
        <div
            className="min-h-screen bg-transparent text-foreground"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {isLocked && <LoginSplash onUnlock={() => setIsLocked(false)} />}
            {!isLocked && <BackgroundSystem />}

            <Navbar onMenuClick={toggle} />
            <Sidebar isOpen={isOpen} onClose={toggle} />

            <main
                className={cn(
                    "transition-all duration-300 min-h-[calc(100vh-var(--navbar-height))] main-content",
                    // Desktop: 
                    // 1. Browsing pages: Push if open (64), 0 push if collapsed (per user request)
                    // 2. Watch/Shorts pages: Always 0 push (it's an overlay)
                    !isWatchPage && isOpen ? "sm:pl-64" : "sm:pl-0",
                    "pl-0" // Mobile: Always 0 push
                )}
            >
                <div
                    className="w-full max-w-[1600px] mx-auto px-4"
                >
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SidebarProvider>
                <StateProvider>
                    <VideoProvider>
                        <ShellContent>{children}</ShellContent>
                    </VideoProvider>
                </StateProvider>
            </SidebarProvider>
        </AuthProvider>
    );
}
