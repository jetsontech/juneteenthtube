"use client";

import { Home, Compass, Library, History, Box, PlaySquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
}

const mainLinks = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Library, label: "Library", href: "/library" },
];

const secondaryLinks = [
    { icon: History, label: "History", href: "/history" },
    { icon: Box, label: "Your Videos", href: "/studio" },
    { icon: Clock, label: "Watch Later", href: "/playlist/watch-later" },
    { icon: PlaySquare, label: "Parade 2024", href: "/playlist/parade-2024" },
];

export function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "fixed top-16 left-0 bottom-0 z-40 bg-j-black/95 backdrop-blur-xl border-r border-white/5 overflow-y-auto transition-all duration-300 scrollbar-none",
                isOpen ? "w-64" : "w-[72px] hidden sm:block"
            )}
        >
            <div className="p-2 space-y-2">
                {mainLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-white/10 group",
                                isActive ? "bg-white/10" : "text-gray-300"
                            )}
                        >
                            <link.icon className={cn("w-6 h-6", isActive ? "text-j-red" : "group-hover:text-white")} />
                            <span className={cn(
                                "text-sm font-medium whitespace-nowrap transition-opacity duration-200",
                                !isOpen && "opacity-0 hidden",
                                isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}

                {isOpen && <hr className="border-white/10 my-2 mx-4" />}

                {isOpen && secondaryLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-4 px-3 py-3 rounded-lg transition-colors hover:bg-white/10 text-gray-300 group"
                    >
                        <link.icon className="w-6 h-6 group-hover:text-white" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                            {link.label}
                        </span>
                    </Link>
                ))}

                {isOpen && (
                    <div className="mt-4 px-4 text-xs text-gray-500">
                        <p>© 2025 Juneteenth Atlanta</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
