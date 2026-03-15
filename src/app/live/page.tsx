"use client";

import { useState, useEffect, useRef } from "react";
import { LivePlayer } from "@/components/live/LivePlayer";
import { LiveChat } from "@/components/live/LiveChat";
import { Channel } from "@/components/live/EPG";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LiveTV() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
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
        console.error("Failed to load Live TV Guide:", {
          message: err.message,
          details: err.details,
          hint: err.hint,
          error: err
        });
      }
    }

    fetchLiveTVData();
    const interval = setInterval(fetchLiveTVData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentChannel) {
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
    <div className="flex flex-col sm:block h-[calc(100dvh-3.5rem)] sm:h-auto overflow-hidden sm:overflow-visible bg-[#141414] text-white font-sans relative z-0">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION — Currently playing channel                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex flex-col w-full relative z-20">
        {/* Channel/Program Info Bar - Sitting ABOVE the player functionally */}
        <div className="w-full bg-[#141414] px-4 md:px-12 py-4 border-b border-white/10 z-30">
          <div className="flex items-start gap-3 md:gap-4 max-w-4xl">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-zinc-900 border border-white/10 shadow-2xl relative overflow-hidden">
              {currentChannel.logo_url ? (
                <img src={currentChannel.logo_url} alt={currentChannel.name} className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-xl font-bold text-white/50">{currentChannel.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white/80">
                  Now Playing • CH {channels.findIndex(c => c.id === currentChannel.id) + 1}
                </span>
              </div>
              {(() => {
                const now = new Date();
                const currentProg = currentChannel.programs?.find(p => {
                  const start = new Date(p.start_time);
                  const end = new Date(p.end_time);
                  return now >= start && now <= end;
                });
                return (
                  <>
                    <h2 className="text-lg md:text-2xl font-black text-white leading-tight truncate">
                      {currentProg ? currentProg.title : currentChannel.name}
                    </h2>
                    {currentProg && (
                      <p className="text-xs md:text-sm text-white/50 font-medium mt-0.5 truncate max-w-xl">
                        {currentProg.description || "Live Broadcast"}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Video Player Boundary */}
        <div className="relative w-full aspect-[16/9] md:aspect-video max-h-[70vh] bg-black border-b border-white/10 shadow-2xl shrink-0 overflow-hidden">
          {(() => {
            const now = new Date();
            const currentProg = currentChannel.programs?.find(p => {
              const start = new Date(p.start_time);
              const end = new Date(p.end_time);
              return now >= start && now <= end;
            });

            const nextProg = currentChannel.programs?.find(p => {
              const start = new Date(p.start_time);
              return start > now;
            });

            return (
              <>
                <LivePlayer
                  streamUrl={currentChannel.stream_url}
                  playlist={currentChannel.playlist}
                  channelName={currentChannel.name}
                  channelLogo={currentChannel.logo_url}
                  channelNumber={channels.findIndex(c => c.id === currentChannel.id) + 1}
                  accentColor={currentChannel.name.includes("Originals") ? "red" : "amber"}
                  currentProgram={currentProg ? {
                    title: currentProg.title,
                    description: currentProg.description,
                    year: "2024",
                    duration: `${Math.round((new Date(currentProg.end_time).getTime() - new Date(currentProg.start_time).getTime()) / 60000)} min`,
                    startTime: currentProg.start_time,
                    endTime: currentProg.end_time
                  } : undefined}
                  nextProgram={nextProg ? {
                    title: nextProg.title,
                    duration: `${Math.round((new Date(nextProg.end_time).getTime() - new Date(nextProg.start_time).getTime()) / 60000)} min`,
                  } : undefined}
                  onToggleChat={() => setIsChatOpen(!isChatOpen)}
                  onNext={() => {
                    const idx = channels.findIndex((c) => c.id === currentChannel.id);
                    setCurrentChannel(channels[(idx + 1) % channels.length]);
                  }}
                  onPrev={() => {
                    const idx = channels.findIndex((c) => c.id === currentChannel.id);
                    setCurrentChannel(channels[(idx - 1 + channels.length) % channels.length]);
                  }}
                />
              </>
            );
          })()}

          <LiveChat
            channelId={currentChannel.id}
            channelName={currentChannel.name}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>

        {/* Channel Controls — Fixed Below Player */}
        <div className="w-full px-4 md:px-12 py-3 bg-[#141414] flex items-center justify-center gap-4 border-b border-white/10 shrink-0">
          <button
            onClick={() => {
              const idx = channels.findIndex(
                (c) => c.id === currentChannel.id,
              );
              setCurrentChannel(
                channels[(idx - 1 + channels.length) % channels.length],
              );
            }}
            className="p-2 md:p-2.5 hover:bg-white/10 rounded-full transition-colors border border-white/10 bg-white/5"
            title="Previous Channel"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white/70 text-sm font-semibold tracking-wide">
            {currentChannel.name}
          </span>
          <button
            onClick={() => {
              const idx = channels.findIndex(
                (c) => c.id === currentChannel.id,
              );
              setCurrentChannel(channels[(idx + 1) % channels.length]);
            }}
            className="p-2 md:p-2.5 hover:bg-white/10 rounded-full transition-colors border border-white/10 bg-white/5"
            title="Next Channel"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scrollable content section */}
      <div className="flex-1 overflow-y-auto sm:overflow-visible bg-[#0a0a0a] relative z-10 overscroll-y-contain pb-20">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CHANNEL ROWS — Grouped by category, Netflix-style           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="relative z-30 pt-4">
          {channelsByCategory.map((group) => (
            <ChannelRow
              key={group.category}
              title={group.category}
              channels={group.channels}
              currentChannelId={currentChannel.id}
              onSelect={setCurrentChannel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* CHANNEL ROW — Horizontal scrolling row of channel cards                */
/* ═══════════════════════════════════════════════════════════════════════ */
function ChannelRow({
  title,
  channels,
  currentChannelId,
  onSelect,
}: {
  title: string;
  channels: Channel[];
  currentChannelId: string;
  onSelect: (c: Channel) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 20);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
    };
  }, [channels]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-6 md:mb-8 group/row">
      <h2 className="text-lg md:text-xl font-bold px-6 md:px-12 mb-2 md:mb-3 text-white/90 tracking-wide">
        {title}
      </h2>

      <div className="relative">
        {/* Left Arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            title="Scroll Left"
            className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-r from-[#141414] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-6 md:px-12 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isActive={channel.id === currentChannelId}
              onSelect={() => onSelect(channel)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            title="Scroll Right"
            className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-gradient-to-l from-[#141414] to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* CHANNEL CARD — Individual channel tile                                  */
/* ═══════════════════════════════════════════════════════════════════════ */
function ChannelCard({
  channel,
  isActive,
  onSelect,
}: {
  channel: Channel;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative shrink-0 w-[160px] md:w-[220px] rounded-md overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 outline-none
                ${isActive ? "ring-2 ring-red-500 scale-105 z-10" : "ring-0"}
            `}
    >
      {/* Card Image */}
      <div className="aspect-video bg-[#0f0f0f] border-b border-white/5 relative overflow-hidden flex items-center justify-center p-3">
        {channel.logo_url ? (
          <img
            src={channel.logo_url}
            alt={channel.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center rounded">
            <span className="text-3xl font-black text-white/30">
              {channel.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Hover Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-xl">
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </div>
        </div>


      </div>

      {/* Card Info */}
      <div className="bg-zinc-800/80 px-3 py-2.5">
        <h3
          className={`text-xs md:text-sm font-bold truncate ${isActive ? "text-white" : "text-white/80"}`}
        >
          {channel.name}
        </h3>
        {channel.description && (
          <p className="text-white/40 text-[10px] md:text-xs truncate mt-0.5">
            {channel.description}
          </p>
        )}
      </div>
    </button>
  );
}
