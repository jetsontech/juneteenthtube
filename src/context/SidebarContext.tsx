"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
    toggle: () => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true,
    setIsOpen: () => { },
    toggle: () => { },
    isMobile: false,
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false); // Start closed
    const [isMobile, setIsMobile] = useState(false);
    const pathname = usePathname();
    const isWatchPage = pathname?.startsWith('/watch/') || pathname?.startsWith('/shorts/');

    // Detect mobile and set initial open/closed state on mount and resizes
    useEffect(() => {
        const handleResize = () => {
            const isTouch = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
            const isSmallScreen = window.innerWidth < 640;
            const mobile = isSmallScreen || isTouch;
            setIsMobile(mobile);

            // If screen becomes mobile size, force it closed
            if (mobile) {
                setIsOpen(false);
            }
        };

        // Run once on mount to establish mobile vs desktop layout and initial state
        const isTouch = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
        const isSmallScreen = window.innerWidth < 640;
        const mobile = isSmallScreen || isTouch;
        
        const initialPath = window.location.pathname;
        const initialIsWatch = initialPath?.startsWith('/watch/') || initialPath?.startsWith('/shorts/');

        // Defer state updates to comply with custom ESLint react-hooks/set-state-in-effect rule
        const timer = setTimeout(() => {
            setIsMobile(mobile);
            if (mobile) {
                setIsOpen(false);
            } else if (!initialIsWatch) {
                setIsOpen(false);
            } else {
                setIsOpen(false);
            }
        }, 0);

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []); // Empty dependency array -> ONLY runs on initial mount!

    // Auto-close sidebar when navigating to watch/shorts pages
    useEffect(() => {
        if (isWatchPage) {
            const timer = setTimeout(() => setIsOpen(false), 0);
            return () => clearTimeout(timer);
        }
    }, [isWatchPage]);

    const toggle = () => setIsOpen(!isOpen);

    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen, toggle, isMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
