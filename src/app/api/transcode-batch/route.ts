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

    // Fire and forget the transcode call so the batcher doesn't timeout
    fetch(`${baseUrl}/api/transcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceKey: v.video_url.split("/").pop(), videoId: v.id })
    }).catch(err => console.error("Background Transcode Trigger Error:", err));

    return NextResponse.json({ message: "Transcode started", id: v.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
