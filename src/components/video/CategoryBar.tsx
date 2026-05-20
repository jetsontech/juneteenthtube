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
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={`cat-pill ${selectedCategory === category ? 'active' : ''}`}
                    >
                        <span className="relative z-10">{category}</span>
                    </button>
                ))}
            </div>
            {/* Premium Scroll Indicators */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-20 group-hover/cat:opacity-100 transition-opacity" />
        </div>
    );
}
