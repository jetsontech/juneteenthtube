"use client";

import { ShortsShelf } from "@/components/video/ShortsShelf";

export default function ShortsPage() {
    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-white mb-6">Shorts</h1>

            {/* Vertical/Portrait Shorts (9:16) */}
            <ShortsShelf title="Vertical Shorts" />
            <ShortsShelf title="Vertical Shorts" offset={6} />

            {/* Landscape Shorts (16:9) */}
            <ShortsShelf title="Landscape Shorts (16:9)" landscapeMode={true} />
            <ShortsShelf title="Landscape Shorts (16:9)" offset={6} landscapeMode={true} />
        </main>
    );
}
