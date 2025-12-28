"use client";

import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { VideoProvider } from "@/context/VideoContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { AuthProvider } from "@/context/AuthContext";
import { StateProvider } from "@/context/StateContext";
import { LoginSplash } from "./LoginSplash";
import { useState, useEffect } from "react";

function ShellContent({ children }: { children: React.ReactNode }) {
    const { isOpen, toggle, setIsOpen } = useSidebar();
    const [isLocked, setIsLocked] = useState(true);
    const [isChecking, setIsChecking] = useState(true);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        const hasAccess = sessionStorage.getItem('guest_access_granted');
        if (hasAccess === 'true') {
            setIsLocked(false);
        }
        setIsChecking(false);
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
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        // Swipe Right (Open) - must start near left edge if closed
        if (diff < -50) {
            if (!isOpen && touchStart < 40) {
                setIsOpen(true);
            }
        }

        // Swipe Left (Close)
        if (diff > 50 && isOpen) {
            setIsOpen(false);
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

            <Navbar onMenuClick={toggle} />
            <Sidebar isOpen={isOpen} onClose={toggle} />

            <main
                className={cn(
                    "pt-14 transition-all duration-300 min-h-screen",
                    isOpen ? "sm:pl-64" : "sm:pl-[72px]"
                )}
                style={{
                    // Use CSS variable for consistent spacing with Navbar/Sidebar
                    paddingTop: 'var(--navbar-height)',
                    paddingRight: 'env(safe-area-inset-right)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    paddingLeft: 'env(safe-area-inset-left)'
                }}
            >
                <div
                    className="max-w-[1600px] mx-auto"
                    style={{
                        paddingLeft: 'env(safe-area-inset-left)',
                        paddingRight: 'env(safe-area-inset-right)',
                    }}
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
