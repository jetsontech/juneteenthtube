"use client";

import { cn } from "@/lib/utils";

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
    return (
        <div className={cn(
            "sticky top-0 z-40 bg-[#0f0f0f] border-b border-white/5 sticky-nav-offset",
            className
        )}
        >
            <div className="px-3 sm:px-6 lg:px-8 py-3">
                <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => onCategoryChange(category)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                selectedCategory === category
                                    ? "bg-white text-black"
                                    : "bg-white/10 text-white hover:bg-white/20"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
