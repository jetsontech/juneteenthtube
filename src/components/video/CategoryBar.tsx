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
        <div className="relative w-full group/cat">
            <div className={cn("cat-bar scrollbar-none", className)}>
                {categories.map((category) => {
                    const isLive = category === "Live";
                    return (
                        <button
                            key={category}
                            onClick={() => {
                                if (isLive) {
                                    router.push("/live");
                                } else {
                                    onCategoryChange(category);
                                }
                            }}
                            className={`cat-pill ${selectedCategory === category && !isLive ? 'active' : ''} ${isLive ? 'relative overflow-hidden border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}
                        >
                            {isLive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-500/20 opacity-0 hover:opacity-100 transition-opacity" />
                            )}
                            {isLive && (
                                <span className="relative flex h-2 w-2 mr-2 inline-flex items-center">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                            <span className="relative z-10">{category}</span>
                        </button>
                    );
                })}
            </div>
            {/* Premium Scroll Indicators */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-20 group-hover/cat:opacity-100 transition-opacity" />
        </div>
    );
}
