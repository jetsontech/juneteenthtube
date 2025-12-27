"use client";

import { ShortsShelf } from "@/components/video/ShortsShelf";

export default function ShortsPage() {
    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-white mb-6">Shorts</h1>
            <ShortsShelf />
            <ShortsShelf offset={6} />
        </main>
    );
}
