"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true,
    toggle: () => { },
    isMobile: false,
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false); // Start closed
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 640; // sm breakpoint
            setIsMobile(mobile);
            // On mobile, always start closed
            // On desktop, open by default
            if (mobile) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggle = () => setIsOpen(!isOpen);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, isMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
