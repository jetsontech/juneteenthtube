type Video = {
  id: string;
  title?: string;
  videoUrl: string | null;
  transcodeStatus?: "pending" | "processing" | "completed" | "failed" | null;
};

import { supabaseAdmin } from "@/lib/supabase-admin";

type DBRow = {
  id?: string | number | null;
  title?: string | null;
  video_url_h264?: string | null;
  video_url?: string | null;
  transcode_status?: string | null;
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("videos")
      .select("id,title,video_url_h264,video_url,transcode_status")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("supabase list error", error);
    }

    const rows = Array.isArray(data) ? (data as DBRow[]) : [];
    const videos = rows.map((r) => ({
      id: String(r.id ?? ""),
      title: r.title ?? null,
      videoUrl: r.video_url_h264 ?? r.video_url ?? null,
      transcodeStatus: (r.transcode_status as Video["transcodeStatus"]) ?? null,
    }));

    return new Response(JSON.stringify({ videos }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: unknown) {
    console.warn("supabase-admin list failed", e);
    const mock: Video[] = [
      { id: "demo-1", title: "Demo Video 1", videoUrl: "/videos/demo-1.mp4", transcodeStatus: "completed" },
      { id: "demo-2", title: "Demo Video 2", videoUrl: "/videos/demo-2.mp4", transcodeStatus: "failed" },
    ];
    return new Response(JSON.stringify({ videos: mock }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}