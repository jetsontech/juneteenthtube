"use client";

import { useState, useEffect, useRef } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { Channel } from "@/components/live/EPG";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

const getCategoryGradient = (category: string) => {
  switch (category) {
    case 'News': return 'bg-gradient-to-br from-blue-900 to-blue-500';
    case 'Music': return 'bg-gradient-to-br from-purple-800 to-pink-600';
    case 'Entertainment': return 'bg-gradient-to-br from-red-700 to-amber-500';
    case 'Sports': return 'bg-gradient-to-br from-green-900 to-green-500';
    case 'Kids': return 'bg-gradient-to-br from-teal-700 to-cyan-500';
    default: return 'bg-gradient-to-br from-zinc-700 to-zinc-500';
  }
};

export default function LiveTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state

  const categories = [
    "All",
    "Entertainment",
    "Movies",
    "News",
    "Music",
    "Kids",
    "Sports",
  ];

  useEffect(() => {
    async function fetchLiveTVData() {
      try {
        // Initial fetch only shows full-screen loader
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("*")
          .eq("status", "active")
          .order("order_index", { ascending: true });

        if (channelError) throw channelError;

        const now = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();

        const { data: epgData, error: epgError } = await supabase
          .from("epg_data")
          .select("*")
          .gte("end_time", now)
          .lte("start_time", tomorrow)
          .order("start_time", { ascending: true });

        if (epgError) throw epgError;

        let videosData: { id: string; video_url: string; video_url_h264: string | null }[] = [];
        if (epgData) {
          const videoIds = epgData
            .map((p) => p.video_id)
            .filter((id) => id !== null);
          if (videoIds.length > 0) {
            const { data: vData } = await supabase
              .from("videos")
              .select("id, video_url, video_url_h264")
              .in("id", videoIds);
            if (vData) videosData = vData;
          }
        }

        if (channelData) {
          const formattedChannels: Channel[] = channelData.map((c) => {
            const channelEpg = epgData
              ? epgData.filter((p) => p.channel_id === c.id)
              : [];
            let playlist: string[] | undefined = undefined;

            if (c.is_internal_vod && channelEpg.length > 0) {
              playlist = channelEpg
                .map((epg) => {
                  const video = videosData.find((v) => v.id === epg.video_id);
                  if (!video) return null;
                  let h264Url = video.video_url_h264;
                  if (h264Url && !h264Url.startsWith("http")) {
                    h264Url = `https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/${h264Url}`;
                  }
                  return h264Url || video.video_url;
                })
                .filter(Boolean) as string[];
            }

            return {
              id: c.id,
              name: c.name,
              description: c.description,
              logo_url: c.logo_url,
              category: c.category || "Entertainment",
              stream_url:
                c.is_internal_vod && playlist && playlist.length > 0
                  ? playlist[0]
                  : c.stream_url,
              playlist: playlist,
              is_internal_vod: c.is_internal_vod,
              programs: channelEpg,
            };
          });

          setChannels(formattedChannels);
          if (formattedChannels.length > 0) {
            setCurrentChannel((prev) => {
              if (prev) {
                const updatedCurrent = formattedChannels.find(
                  (c) => c.id === prev.id,
                );
                return updatedCurrent || formattedChannels[0];
              }
              return formattedChannels[0];
            });
          }
        }
      } catch (err: any) {
        console.error("Failed to load Live TV Guide:", err);
        // Emergency Fallback so the site isn't "broken" if Supabase fails
        if (channels.length === 0) {
          const fallback = {
            id: 'fallback',
            name: 'BET Classics (Backup)',
            stream_url: 'https://jmp2.uk/bet-classics.m3u8',
            category: 'Entertainment',
            description: 'Backup signal active'
          } as Channel;
          setChannels([fallback]);
          setCurrentChannel(fallback);
        }
      } finally {
        // This ensures the LOADING screen disappears regardless of success or error
        setLoading(false);
      }
    }

    fetchLiveTVData();
    const interval = setInterval(fetchLiveTVData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update check: Use the loading state instead of just currentChannel
  if (loading && !currentChannel) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-red-600 animate-spin mb-6"></div>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
            Loading Juneteenthtube
          </p>
        </div>
      </div>
    );
  }

  // Group channels by category dynamically
  const uniqueCategories = Array.from(
    new Set(channels.map((c) => c.category)),
  ).filter(Boolean);
  const channelsByCategory = uniqueCategories
    .map((cat) => ({
      category: cat,
      channels: channels.filter((c) => c.category === cat),
    }))
    .filter((group) => group.channels.length > 0)
    .sort((a, b) => a.category.localeCompare(b.category));

  return (
    <div className="flex flex-col sm:block h-[calc(100dvh-var(--navbar-h))] sm:h-auto overflow-hidden sm:overflow-visible bg-[#141414] text-white font-sans relative z-0">
      {/* Rest of your HERO and CHANNEL ROW code remains the same... */}
