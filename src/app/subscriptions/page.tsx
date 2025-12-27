"use client";

import { Users } from "lucide-react";

export default function SubscriptionsPage() {
    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-white mb-6">Subscriptions</h1>

            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="w-16 h-16 text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No subscriptions yet</h2>
                <p className="text-gray-400 max-w-md">
                    Subscribe to channels to see their latest videos here.
                    Start exploring to find content you love!
                </p>
            </div>
        </main>
    );
}
