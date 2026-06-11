"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ShortsShelf } from "@/components/video/ShortsShelf";

export default function ShortsPage() {
    const router = useRouter();

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h1 className="text-2xl font-bold text-white">Shorts</h1>
            </div>

            {/* Vertical/Portrait Shorts (9:16) */}
            <ShortsShelf title="Vertical Shorts" />
            <ShortsShelf title="Vertical Shorts" offset={6} />

            {/* Landscape Shorts (16:9) */}
            <ShortsShelf title="Landscape Shorts (16:9)" landscapeMode={true} />
            <ShortsShelf title="Landscape Shorts (16:9)" offset={6} landscapeMode={true} />
        </main>
    );
}
