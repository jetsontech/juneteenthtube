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

    // Detect mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            // Mobile if: width < 640 OR device has coarse pointer (touch) OR no hover capability
            const isTouch = window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(hover: none)").matches;
            const isSmallScreen = window.innerWidth < 640; // sm breakpoint
            const mobile = isSmallScreen || isTouch;

            setIsMobile(mobile);
            // On mobile, always start closed
            // On desktop, open by default on browse pages, closed on watch/shorts
            if (mobile) {
                setIsOpen(false);
            } else if (!isWatchPage) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isWatchPage]);

    // Auto-close sidebar when navigating to watch/shorts pages
    useEffect(() => {
        if (isWatchPage) {
            setIsOpen(false);
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
