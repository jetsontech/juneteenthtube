"use client";

import { Home, Library, History, PlaySquare, Clock, Users, Film, Image, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const mainLinks = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Film, label: "Shorts", href: "/shorts" }, // Lucide doesn't have exact Shorts logo, Film is close enough for icon
    { icon: PlaySquare, label: "Video Gallery", href: "/gallery" },
    { icon: Image, label: "Photo Gallery", href: "/photos" },
    { icon: Flag, label: "Georgia United", href: "/georgia-united" },
    { icon: Users, label: "Subscriptions", href: "/subscriptions" },
];

const secondaryLinks = [
    { icon: Library, label: "You", href: "/you" },
    { icon: History, label: "History", href: "/history" },
    { icon: PlaySquare, label: "Your Videos", href: "/studio" },
    { icon: Clock, label: "Watch Later", href: "/playlist/watch-later" },
];

import { useState } from "react";
import { useSidebar } from "@/context/SidebarContext";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { isMobile, setIsOpen } = useSidebar();
    const [isHovered, setIsHovered] = useState(false);

    // Visual state: Open if pinned (isOpen) OR hovered
    const isExpanded = isOpen || isHovered;

    const handleMobileClose = () => {
        if (isMobile) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] sm:hidden transition-opacity duration-300"
                    onClick={onClose}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "fixed left-0 bottom-0 z-[100] glass-heavy overflow-y-auto transition-all duration-300 scrollbar-none",
                    // Mobile: Slide in/out, always w-64 when visible/animating
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
                    // Desktop: Always visible (translate-0), toggle width
                    "sm:translate-x-0",
                    isExpanded ? "sm:w-64 border-r border-white/5" : "sm:w-[72px]",
                    (isHovered && !isOpen) && "shadow-2xl shadow-black/50 border-r border-white/5"
                )}
                style={{
                    top: 'var(--navbar-height)',
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingBottom: 'env(safe-area-inset-bottom)'
                }}
            >
                <div className="p-2 space-y-2">
                    {mainLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={handleMobileClose}
                                className={cn(
                                    "flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 hover:glass-button group",
                                    isActive ? "glass-button border-l-2 border-l-j-red bg-white/5" : "text-gray-300 border-l-2 border-l-transparent"
                                )}
                            >
                                <link.icon className={cn("w-6 h-6 shrink-0", isActive ? "text-j-red" : "group-hover:text-white")} />
                                <span className={cn(
                                    "text-sm font-medium whitespace-nowrap transition-opacity duration-200",
                                    !isExpanded && "opacity-0 hidden",
                                    isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                                )}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}

                    {isExpanded && <hr className="border-white/10 my-2 mx-4" />}

                    {isExpanded && secondaryLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleMobileClose}
                            className="flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-white/10 text-gray-300 group"
                        >
                            <link.icon className="w-6 h-6 group-hover:text-white" />
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                                {link.label}
                            </span>
                        </Link>
                    ))}

                    {isExpanded && (
                        <div className="mt-4 px-4 text-xs text-gray-500">
                            <p>© 2026 Net Post Media, llc</p>
                        </div>
                    )}
                </div>
            </aside >
        </>
    );
}
