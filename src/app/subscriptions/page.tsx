"use client";

import { useState, useEffect, useMemo } from "react";
import { useVideo } from "@/context/VideoContext";
import { useAuth } from "@/context/AuthContext";
import { VideoCard } from "@/components/video/VideoCard";
import { Users, Bell, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const translations = new Map<string, string>([
    ["subscriptions", "Subscriptions"],
    ["noSubscriptions", "No subscriptions yet"],
    ["noSubPrompt", "Subscribe to channels while watching videos to see their latest content here."],
    ["discoverChannels", "Discover Channels"],
    ["latestFromChannels", "Latest from your channels"],
    ["noVideosYet", "No videos yet from your subscribed channels."]
]);

const t = (key: string) => {
    return translations.get(key) || key;
};

// Get or create a stable guest ID for subscription lookups
function getGuestId(): string {
    if (typeof window === "undefined") return "";
    let guestId = localStorage.getItem("jt_guest_id");
    if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("jt_guest_id", guestId);
    }
    return guestId;
}

interface ChannelInfo {
    name: string;
    videoCount: number;
    avatar: string;
}

export default function SubscriptionsPage() {
    const { videos, toggleSubscription } = useVideo();
    const { user } = useAuth();
    const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [unsubscribing, setUnsubscribing] = useState<string | null>(null);

    // Fetch all subscriptions for this guest/user
    useEffect(() => {
        const fetchSubscriptions = async () => {
            setLoadingChannels(true);
            try {
                const guestId = getGuestId();
                const headers: Record<string, string> = { "x-guest-id": guestId };
                if (user?.id) {
                    headers["x-user-id"] = user.id;
                }
                const res = await fetch(`/api/subscribe/all`, { headers });
                if (res.ok) {
                    const { channels } = await res.json();
                    setSubscribedChannels(channels || []);
                } else {
                    // Fallback: derive from localStorage if API isn't available
                    const stored = localStorage.getItem("jt_subscriptions");
                    setSubscribedChannels(stored ? JSON.parse(stored) : []);
                }
            } catch {
                const stored = localStorage.getItem("jt_subscriptions");
                setSubscribedChannels(stored ? JSON.parse(stored) : []);
            } finally {
                setLoadingChannels(false);
            }
        };
        fetchSubscriptions();
    }, [user?.id]);

    // Build channel info from the video library
    const channelMap = useMemo((): ChannelInfo[] => {
        const map = new Map<string, ChannelInfo>();
        videos.forEach(v => {
            if (!map.has(v.channelName)) {
                map.set(v.channelName, {
                    name: v.channelName,
                    videoCount: 0,
                    avatar: v.channelAvatar || "",
                });
            }
            map.get(v.channelName)!.videoCount++;
        });
        return Array.from(map.values());
    }, [videos]);

    // Videos from subscribed channels
    const subscriptionVideos = useMemo(() => {
        if (subscribedChannels.length === 0) return [];
        return videos
            .filter(v => subscribedChannels.includes(v.channelName))
            .sort((a, b) => {
                // Sort by most recent first
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
    }, [videos, subscribedChannels]);

    const subscribedChannelInfo = useMemo(() =>
        channelMap.filter(c => subscribedChannels.includes(c.name)),
        [channelMap, subscribedChannels]
    );

    const handleUnsubscribe = async (channelName: string) => {
        setUnsubscribing(channelName);
        try {
            await toggleSubscription(channelName);
            setSubscribedChannels(prev => prev.filter(c => c !== channelName));
            // Also update localStorage fallback
            const updated = subscribedChannels.filter(c => c !== channelName);
            localStorage.setItem("jt_subscriptions", JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        } finally {
            setUnsubscribing(null);
        }
    };

    if (loadingChannels) {
        return (
            <main className="px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-2xl font-bold text-white mb-6">{t("subscriptions")}</h1>
                <div className="flex gap-3 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </main>
        );
    }

    if (subscribedChannels.length === 0) {
        return (
            <main className="px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-2xl font-bold text-white mb-6">{t("subscriptions")}</h1>
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">{t("noSubscriptions")}</h2>
                    <p className="text-gray-400 max-w-sm mb-6">
                        {t("noSubPrompt")}
                    </p>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-j-red hover:bg-red-700 text-white font-semibold rounded-full transition-colors"
                    >
                        {t("discoverChannels")}
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">{t("subscriptions")}</h1>

            {/* Channel Avatars Row */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar">
                {subscribedChannelInfo.map(channel => (
                    <div key={channel.name} className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer">
                        <div className="relative">
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-j-green to-j-gold overflow-hidden ring-2 ring-j-gold/30 group-hover:ring-j-gold transition-all">
                                {channel.avatar ? (
                                    <Image src={channel.avatar} alt={channel.name} fill className="object-cover" sizes="64px" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                                        {channel.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-j-red rounded-full flex items-center justify-center">
                                <Bell className="w-2.5 h-2.5 text-white fill-white" />
                            </div>
                        </div>
                        <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors text-center max-w-[72px] truncate font-medium">
                            {channel.name}
                        </span>
                        <button
                            onClick={() => handleUnsubscribe(channel.name)}
                            disabled={unsubscribing === channel.name}
                            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors font-medium"
                        >
                            {unsubscribing === channel.name ? "..." : "Unsubscribe"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Latest Videos */}
            <div className="flex items-center gap-3 mb-4">
                <Play className="w-5 h-5 text-j-red fill-j-red" />
                <h2 className="text-lg font-semibold text-white">{t("latestFromChannels")}</h2>
                <span className="text-gray-500 text-sm">({subscriptionVideos.length} videos)</span>
            </div>

            {subscriptionVideos.length === 0 ? (
                <div className="py-12 text-center bg-white/[0.03] border border-white/5 rounded-2xl">
                    <p className="text-gray-400">{t("noVideosYet")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {subscriptionVideos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
            )}
        </main>
    );
}
