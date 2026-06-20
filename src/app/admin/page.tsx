"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ShieldCheck, RefreshCw, AlertCircle, Edit3, ArrowLeft, Video as VideoIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Video = {
  id: string;
  title?: string;
  videoUrl: string;
  transcodeStatus?: "pending" | "processing" | "completed" | "failed" | null;
};

export default function AdminPage(): React.ReactElement {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchVideos();
    }
  }, [user, isAdmin]);

  async function fetchVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/videos");
      if (!res.ok) throw new Error(`Failed to load videos: ${res.status}`);
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON response from /api/admin/videos");
      }

      const list: Video[] = Array.isArray(data)
        ? (data as Video[])
        : (data && typeof data === "object" && Array.isArray((data as { videos?: unknown }).videos)
            ? ((data as { videos: unknown }).videos as Video[])
            : []);
      setVideos(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReTriggerTranscode(id: string, filename?: string) {
    const v = videos.find(x => x.id === id);
    if (v?.transcodeStatus === "processing" || v?.transcodeStatus === "pending") {
      setRowErrors(prev => ({ ...prev, [id]: "Transcode already in progress" }));
      return;
    }

    setBusyId(id);
    setRowErrors(prev => ({ ...prev, [id]: "" }));

    try {
      const body = { id, filename };
      const res = await fetch("/api/admin/retrigger-transcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to re-trigger: ${res.status} ${text}`);
      }
      setVideos((prev) => prev.map(v => v.id === id ? { ...v, transcodeStatus: "processing" } : v));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRowErrors(prev => ({ ...prev, [id]: msg || "Failed to re-trigger transcode" }));
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-j-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_100%_0%,_#3f2e05_0%,_transparent_70%)] opacity-30 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-[radial-gradient(circle_at_0%_100%,_#0a2f0a_0%,_transparent_70%)] opacity-20 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-j-gold font-black tracking-widest text-lg uppercase">
              <ShieldCheck className="w-6 h-6" />
              SYSTEM CONTROL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin — Video Transcode Pipeline</h1>
          </div>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold text-sm shrink-0 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Info & Error Banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 backdrop-blur-md rounded-2xl p-4 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between items-center gap-4 bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-2xl p-4">
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
            {videos.length} Master Videos Registered
          </p>
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-j-gold hover:bg-j-gold-light disabled:opacity-50 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)]"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>

        {/* Video Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-white/[0.03] text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Video URL</th>
                <th className="px-6 py-4">Transcode Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {videos.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No videos registered.
                  </td>
                </tr>
              )}

              {videos.map((video) => {
                const filename = (video.videoUrl || "").split("/").pop();
                const isProcessing = video.transcodeStatus === "processing" || video.transcodeStatus === "pending";
                const disabled = busyId === video.id || isProcessing;
                
                // Styling the status badge
                let statusBadgeClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                if (video.transcodeStatus === "completed") {
                  statusBadgeClass = "bg-green-500/10 text-green-400 border-green-500/20";
                } else if (video.transcodeStatus === "processing" || video.transcodeStatus === "pending") {
                  statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
                } else if (video.transcodeStatus === "failed") {
                  statusBadgeClass = "bg-red-500/10 text-red-400 border-red-500/20";
                }

                return (
                  <tr key={video.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-bold text-sm text-gray-200">
                      <div className="flex items-center gap-2.5">
                        <VideoIcon className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="line-clamp-1">{video.title || "(Untitled Video)"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400 max-w-xs truncate">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors block"
                        title={video.videoUrl}
                      >
                        {filename || video.videoUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", statusBadgeClass)}>
                        {video.transcodeStatus || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all border border-amber-500/30",
                            isProcessing
                              ? "bg-amber-500/10 text-amber-400 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-600 text-black hover:scale-[1.02] shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          )}
                          disabled={disabled}
                          onClick={() => handleReTriggerTranscode(video.id, filename || undefined)}
                        >
                          {busyId === video.id ? "Re-triggering…" : (isProcessing ? "Processing…" : "Re-trigger Transcode")}
                        </button>

                        <button
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 hover:text-white text-gray-300 text-xs font-bold rounded-xl transition-all border border-white/10"
                          onClick={() => {
                            window.open(`/admin/video/${video.id}`, "_blank");
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>

                      {rowErrors[video.id] && (
                        <div className="text-xs text-red-400 mt-1 font-semibold">{rowErrors[video.id]}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}