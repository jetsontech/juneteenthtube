"use client";

import { Clock } from "lucide-react";

export default function WatchLaterPage() {
    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-white mb-6">Watch Later</h1>

            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No videos saved</h2>
                <p className="text-gray-400 max-w-md">
                    Save videos to watch later by clicking the save button on any video.
                </p>
            </div>
        </main>
    );
}
