"use client";

import { useAuth } from "@/context/AuthContext";
import { useVideo } from "@/context/VideoContext";
import { useMemo } from "react";
import { Video, Clock, History, Settings, Film, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Simple localization dictionary & helper to resolve internationalization warnings
const translations = new Map<string, string>([
    ["settings", "Settings"],
    ["uploads", "Uploads"],
    ["watched", "Watched"],
    ["saved", "Saved"],
    ["yourVideos", "Your Videos"],
    ["watchHistory", "Watch History"],
    ["watchLater", "Watch Later"],
    ["explore", "Explore"],
    ["discoverNewContent", "Discover new content"],
    ["recentlyWatched", "Recently Watched"],
    ["seeAll", "See all →"],
    ["signInToSeeProfile", "Sign in to see your profile"]
]);

const t = (key: string) => {
    return translations.get(key) || key;
};


export default function YouPage() {
    const { user } = useAuth();
    const { videos, watchHistory, watchLater } = useVideo();

    const myVideos = useMemo(() => {
        return videos.filter(v => v.ownerId === user?.id);
    }, [videos, user?.id]);

    const watchLaterVideos = useMemo(() => {
        return watchLater
            .map(id => videos.find(v => v.id === id))
            .filter((v): v is NonNullable<typeof v> => v !== undefined);
    }, [watchLater, videos]);

    const userAvatar = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest";
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto min-h-screen">
            {/* Profile Header */}
            <div className="relative mb-8">
                {/* Banner */}
                <div className="h-24 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-900/30 via-zinc-900 to-emerald-900/20 border border-white/[0.04]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,158,11,0.08),transparent_50%)]" />
                </div>

                {/* Avatar + Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 sm:-mt-12 px-4 sm:px-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl ring-4 ring-[#0f0f0f] shadow-2xl flex-shrink-0 relative overflow-hidden">
                        {userAvatar ? (
                            <Image src={userAvatar} alt="Avatar" fill className="object-cover" unoptimized />
                        ) : (
                            userInitial
                        )}
                    </div>
                    <div className="text-center sm:text-left pb-1">
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{userName}</h1>
                        <p className="text-zinc-400 text-sm">{user?.email || t("signInToSeeProfile")}</p>
                    </div>
                    <div className="sm:ml-auto">
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/[0.08] rounded-xl text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <Settings className="w-4 h-4" />
                            {t("settings")}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-black text-white">{myVideos.length}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-0.5">{t("uploads")}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-black text-white">{watchHistory.length}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-0.5">{t("watched")}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                    <p className="text-xl sm:text-2xl font-black text-white">{watchLaterVideos.length}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-medium mt-0.5">{t("saved")}</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <Link href="/studio" className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <Video className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">{t("yourVideos")}</h3>
                        <p className="text-zinc-500 text-xs">{myVideos.length} {t("uploads").toLowerCase()}</p>
                    </div>
                </Link>
                <Link href="/history" className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <History className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">{t("watchHistory")}</h3>
                        <p className="text-zinc-500 text-xs">{watchHistory.length} {t("watched").toLowerCase()}</p>
                    </div>
                </Link>
                <Link href="/library" className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                        <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">{t("watchLater")}</h3>
                        <p className="text-zinc-500 text-xs">{watchLaterVideos.length} {t("saved").toLowerCase()}</p>
                    </div>
                </Link>
                <Link href="/explore" className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">{t("explore")}</h3>
                        <p className="text-zinc-500 text-xs">{t("discoverNewContent")}</p>
                    </div>
                </Link>
            </div>

            {/* Recent Watch History Preview */}
            {watchHistory.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-zinc-400" />
                            {t("recentlyWatched")}
                        </h2>
                        <Link href="/history" className="text-sm text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                            {t("seeAll")}
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {watchHistory.slice(0, 4).map((video) => (
                            <Link
                                key={video.id}
                                href={`/watch/${video.id}`}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group"
                            >
                                <div className="w-28 aspect-video rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 relative">
                                    {video.thumbnail && video.thumbnail !== "/placeholder.svg" ? (
                                        <Image src={video.thumbnail} alt={video.title} fill sizes="112px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                                            <Film className="w-4 h-4 text-zinc-700" />
                                        </div>
                                    )}
                                    {video.duration && video.duration !== "0:00" && (
                                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] text-white font-bold">
                                            {video.duration}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                                        {video.title}
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-0.5">{video.channelName} • {video.views} views</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
