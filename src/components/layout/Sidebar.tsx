"use client";

import { Home, Library, History, PlaySquare, Clock, Users, Film, Image, Flag, Map, Database, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { useStateFilter } from "@/context/StateContext";
import { US_STATES } from "@/lib/states";

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

export function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();
    const { isMobile, setIsOpen } = useSidebar();
    const { user } = useAuth();
    const { selectedState, setSelectedState } = useStateFilter();

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

                {/* Mobile State Selector */}
                <div className="sm:hidden px-4 py-2 mx-2 mb-2 flex flex-col gap-1.5">
                    <div className="text-[10px] font-bold tracking-[0.14em] text-zinc-500 uppercase">Region</div>
                    <select
                        title="State Selector"
                        value={selectedState.code}
                        onChange={(e) => {
                            const state = US_STATES.find(s => s.code === e.target.value);
                            if (state) setSelectedState(state);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-gray-300 text-xs font-sans cursor-pointer outline-none"
                    >
                        <option value="GLOBAL" className="bg-[#111]">All States</option>
                        {US_STATES.filter(s => s.code !== "GLOBAL").map(s => (
                            <option key={s.code} value={s.code} className="bg-[#111]">{s.name}</option>
                        ))}
                    </select>
                    <div className="h-px bg-white/5 my-2" />
                </div>

                <div className="sidebar-section-title">Discover</div>

                {mainLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleMobileClose}
                            className={`flex items-center gap-4 px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-gradient-to-r from-amber-500/20 to-red-500/10 text-white shadow-[inset_3px_0_0_#D4AF37,0_0_20px_rgba(212,175,55,0.15)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <link.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : ''}`} />
                            {link.label}
                        </Link>
                    );
                })}

                <div className="sidebar-divider" />
                <div className="sidebar-section-title">Your Library</div>

                {secondaryLinks.map((link) => {
                    if (link.label === "Admin Panel" && !user) return null;

                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={handleMobileClose}
                            className={`flex items-center gap-4 px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-gradient-to-r from-amber-500/20 to-red-500/10 text-white shadow-[inset_3px_0_0_#D4AF37,0_0_20px_rgba(212,175,55,0.15)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <link.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : ''}`} />
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
