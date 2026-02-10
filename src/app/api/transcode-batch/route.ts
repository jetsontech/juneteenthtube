import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function isHEVC(url: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith(".mov") || url.includes("quicktime");
}

export async function GET() {
  try {
    const { data } = await supabase.from("videos").select("title, video_url_h264, transcode_status");
    return NextResponse.json({ videos: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { data } = await supabase.from("videos")
      .select("id, video_url")
      .is("video_url_h264", null)
      .not("video_url", "is", null);

    const pending = data?.filter((v: { id: string; video_url: string }) => isHEVC(v.video_url)) || [];

    if (pending.length === 0) return NextResponse.json({ message: "No work remaining" });

    const v = pending[0];

    // Use relative URL for Vercel compatibility (no hardcoded localhost)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000";

    // Await the fetch to ensure the request is sent before the function terminates
    // Note: Since api/transcode now awaits ffmpeg, this entire call will wait for transcoding to finish.
    // This might timeout if transcoding takes >10-60s, but it's safer than fire-and-forget on Vercel.
    try {
      const res = await fetch(`${baseUrl}/api/transcode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey: v.video_url.split("/").pop(), videoId: v.id })
      });

      if (!res.ok) throw new Error(`Transcode API responded with ${res.status}`);
    } catch (err) {
      console.error("Transcode Trigger Error:", err);
      return NextResponse.json({ error: "Failed to trigger transcode" }, { status: 500 });
    }

    return NextResponse.json({ message: "Transcode completed for video", id: v.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
