"use client";

import { Home, Library, History, PlaySquare, Clock, Users, Film, Image, Flag, Map, Database, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const mainLinks = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Film, label: "Shorts", href: "/shorts" },
    { icon: Map, label: "Freedom Map", href: "/freedom-map" },
    { icon: Library, label: "Legacy Vault", href: "/vault" },
    { icon: Database, label: "Archives", href: "/research" },
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
    { icon: Shield, label: "Admin Panel", href: "/admin" },
];

import { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { isMobile, setIsOpen } = useSidebar();
    const { user } = useAuth();

    // The visual state of the sidebar is dictated by context "isOpen"
    // No hover mechanism needed for the new UI format, it acts as a drawer

    const handleMobileClose = () => {
        if (isMobile) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`sidebar-backdrop ${isOpen ? 'visible' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            <aside className={`sidebar glass-heavy ${isOpen ? 'open' : ''}`}>
                <div className="gloss-overlay" />
                <div className="sidebar-section-title">Discover</div>

                {mainLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleMobileClose}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <link.icon className="nav-icon" />
                            {link.label}
                        </Link>
                    );
                })}

                <div className="sidebar-divider" />
                <div className="sidebar-section-title">Your Library</div>

                {secondaryLinks.map((link) => {
                    // Make some links require auth optionally if desired
                    if (link.label === "Admin Panel" && !user) return null;

                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleMobileClose}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                        >
                            <link.icon className="nav-icon" />
                            {link.label}
                        </Link>
                    );
                })}

                <div className="sidebar-footer">
                    About • Contact <br />
                    TOS • Privacy Policy <br />
                    © 2026 Net Post Media
                </div>
            </aside>
        </>
    );
}
