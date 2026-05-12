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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveTVData() {
      try {
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("*")
          .eq("status", "active")
          .order("order_index", { ascending: true });

        if (channelError) throw channelError;

        const now = new Date().toISOString();
        const tomorrow = new Date(Date.now() + 86400000).toISOString();

        const { data: epgData } = await supabase
          .from("epg_data")
          .select("*")
          .gte("end_time", now)
          .lte("start_time", tomorrow)
          .order("start_time", { ascending: true });

        if (channelData) {
          const formattedChannels: Channel[] = channelData.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            logo_url: c.logo_url,
            category: c.category || "Entertainment",
            stream_url: c.stream_url,
            programs: epgData ? epgData.filter((p) => p.channel_id === c.id) : [],
          }));

          setChannels(formattedChannels);
          if (formattedChannels.length > 0 && !currentChannel) {
            setCurrentChannel(formattedChannels[0]);
          }
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveTVData();
  }, []);

  if (loading && !currentChannel) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-red-600 animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!currentChannel) return null;

  return (
    <div className="flex flex-col h-screen bg-[#141414] text-white">
      <div className="flex-1 relative bg-black">
        <LivePlayer 
          streamUrl={currentChannel.stream_url} 
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />
        <LiveChat 
          channelId={currentChannel.id} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>
      <div className="h-1/3 overflow-y-auto p-6 bg-[#0a0a0a]">
         <h2 className="text-xl font-bold mb-4 px-4">Channel Guide</h2>
         <div className="flex gap-4 overflow-x-auto pb-4">
            {channels.map(channel => (
              <button 
                key={channel.id} 
                onClick={() => setCurrentChannel(channel)}
                className={`flex-shrink-0 w-48 p-4 rounded-xl transition-all ${currentChannel.id === channel.id ? 'bg-red-600' : 'bg-zinc-900'}`}
              >
                <p className="font-bold truncate">{channel.name}</p>
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
