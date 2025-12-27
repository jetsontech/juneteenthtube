"use client";

import { useAuth } from "@/context/AuthContext";
import { User, Video, Clock, ThumbsUp } from "lucide-react";
import Link from "next/link";

export default function YouPage() {
    const { user } = useAuth();

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">You</h1>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-j-green rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {user?.email?.charAt(0).toUpperCase() || "G"}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {user?.user_metadata?.full_name || user?.email || "Guest User"}
                        </h2>
                        <p className="text-gray-400 text-sm">{user?.email || "Sign in to see your profile"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/studio" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Video className="w-8 h-8 text-j-red mb-2" />
                    <h3 className="text-white font-medium">Your Videos</h3>
                    <p className="text-gray-400 text-sm">Manage your uploads</p>
                </Link>
                <Link href="/history" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <Clock className="w-8 h-8 text-j-gold mb-2" />
                    <h3 className="text-white font-medium">Watch History</h3>
                    <p className="text-gray-400 text-sm">Recently watched</p>
                </Link>
                <Link href="/playlist/watch-later" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <ThumbsUp className="w-8 h-8 text-j-green mb-2" />
                    <h3 className="text-white font-medium">Watch Later</h3>
                    <p className="text-gray-400 text-sm">Saved videos</p>
                </Link>
            </div>
        </main>
    );
}
