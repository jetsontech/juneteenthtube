"use client";

import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

interface CategoryBarProps {
    categories: readonly string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    className?: string;
}

export function CategoryBar({
    categories,
    selectedCategory,
    onCategoryChange,
    className
}: CategoryBarProps) {
    const router = useRouter();

    return (
        <div className={cn(
            "sticky z-40 bg-[#0f0f0f] border-b border-white/5 sticky-nav-offset",
            className
        )}
        >
            <div className="px-3 sm:px-6 lg:px-8 py-3">
                <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => {
                                if (category === "Live") {
                                    router.push("/live");
                                } else {
                                    onCategoryChange(category);
                                }
                            }}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center relative shadow-sm",
                                selectedCategory === category && category !== "Live"
                                    ? "bg-white text-black"
                                    : "bg-white/10 text-white hover:bg-white/20",
                                category === "Live" && "overflow-hidden border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                            )}
                        >
                            {/* Live Category Gradient Pulse Background */}
                            {category === "Live" && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-500/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                            )}

                            {/* Live Indicator Dot */}
                            {category === "Live" && (
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}

                            <span className="relative z-10">{category}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
