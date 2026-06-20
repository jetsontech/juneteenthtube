import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("id, video_url, transcode_status")
            .or("video_url_h264.is.null,video_url_h264.not.ilike.%.m3u8%")
            .not("video_url", "is", null);

        if (error) {
            throw error;
        }

        // Only dispatch videos that aren't already processing
        const pending = data?.filter(v => v.transcode_status !== "processing") || [];

        if (pending.length === 0) {
            return NextResponse.json({ message: "No videos need HLS transcoding at this time." });
        }

        if (!process.env.GITHUB_DISPATCH_TOKEN) {
            throw new Error("GITHUB_DISPATCH_TOKEN is not configured.");
        }

        let dispatchedCount = 0;

        // Dispatch to GitHub Actions for each pending video
        for (const v of pending) {
            await supabase
                .from("videos")
                .update({ transcode_status: "processing" })
                .eq("id", v.id);

            try {
                await fetch(
                  'https://api.github.com/repos/jetsontech/juneteenthtube/dispatches',
                  {
                    method: 'POST',
                    headers: {
                      'Accept': 'application/vnd.github.v3+json',
                      'Authorization': `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
                    },
                    body: JSON.stringify({
                      event_type: 'transcode',
                      client_payload: {
                        videoId: v.id,
                        video_url: v.video_url
                      },
                    }),
                  }
                );
                dispatchedCount++;
                console.log(`[Batcher API] Dispatched HLS transcode for video: ${v.id}`);
            } catch (dispatchErr) {
                console.error(`[Batcher API] Failed to dispatch video ${v.id}:`, dispatchErr);
                // Revert status on failure
                await supabase
                    .from("videos")
                    .update({ transcode_status: "pending" })
                    .eq("id", v.id);
            }
        }

        return NextResponse.json({ 
            message: `Successfully dispatched ${dispatchedCount} videos to the HLS cloud transcoder.`,
            count: dispatchedCount
        });

    } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`[Batcher API] POST Exception:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
