"use client";

import React, { useEffect, useState } from "react";

type Video = {
  id: string;
  title?: string;
  videoUrl: string;
  transcodeStatus?: "pending" | "processing" | "completed" | "failed" | null;
};

export default function AdminPage(): React.ReactElement {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVideos();
  }, []);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Videos</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          className="px-3 py-2 bg-gray-800 text-white rounded"
          onClick={fetchVideos}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh list"}
        </button>
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Title</th>
            <th className="py-2">Video URL</th>
            <th className="py-2">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-sm text-gray-600">
                No videos found.
              </td>
            </tr>
          )}

          {videos.map((video) => {
            const filename = (video.videoUrl || "").split("/").pop();
            const isProcessing = video.transcodeStatus === "processing" || video.transcodeStatus === "pending";
            const disabled = busyId === video.id || isProcessing;
            return (
              <tr key={video.id} className="border-b">
                <td className="py-2 align-top">{video.title || "(untitled)"}</td>
                <td className="py-2 break-all align-top">
                  <a href={video.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {filename || video.videoUrl}
                  </a>
                </td>
                <td className="py-2 align-top">{video.transcodeStatus || "unknown"}</td>
                <td className="py-2 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 bg-amber-500 text-white rounded disabled:opacity-50"
                        disabled={disabled}
                        onClick={() => handleReTriggerTranscode(video.id, filename || undefined)}
                      >
                        {busyId === video.id ? "Re-triggering…" : (isProcessing ? "Processing…" : "Re-trigger Transcode")}
                      </button>

                      <button
                        className="px-2 py-1 bg-gray-700 text-white rounded"
                        onClick={() => {
                          window.open(`/admin/video/${video.id}`, "_blank");
                        }}
                      >
                        Edit
                      </button>
                    </div>

                    {rowErrors[video.id] && (
                      <div className="text-sm text-red-500">{rowErrors[video.id]}</div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}