import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleTranscoding } from "../transcode/worker";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { mkdir } from "fs/promises";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isHEVC(url: string | null | undefined): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith(".mov") || lower.includes("quicktime") || lower.includes(".mov?");
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("id, title, video_url, video_url_h264, transcode_status");

        if (error) {
            throw error;
        }

        return NextResponse.json({ videos: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    }
}

export async function POST() {
    try {
        const { data, error } = await supabase
            .from("videos")
            .select("id, video_url, transcode_status")
            .is("video_url_h264", null)
            .not("video_url", "is", null);

        if (error) {
            throw error;
        }

        // Select HEVC/MOV videos that are not currently in progress or already completed
        const pending = data?.filter(v => 
            isHEVC(v.video_url) && 
            v.transcode_status !== "processing" && 
            v.transcode_status !== "completed"
        ) || [];

        if (pending.length === 0) {
            return NextResponse.json({ message: "No work remaining" });
        }

        // Process the first pending video
        const v = pending[0];
        const sourceKey = v.video_url!.split("/").pop();

        if (!sourceKey) {
            throw new Error(`Could not parse sourceKey from video URL: ${v.video_url}`);
        }

        // Update database to "processing" immediately
        const { error: dbError } = await supabase
            .from("videos")
            .update({
                transcode_status: "processing",
            })
            .eq("id", v.id);

        if (dbError) {
            throw dbError;
        }

        // Initialize temp directory
        const tempDir = join(tmpdir(), "transcode-" + randomUUID());
        await mkdir(tempDir, { recursive: true });

        // Trigger transcoding workflow directly in the background
        handleTranscoding(sourceKey, v.id, tempDir).catch((bgErr) => {
            console.error(`[Batcher API] Background task exception for video ${v.id}:`, bgErr);
        });

        return NextResponse.json({ 
            message: "Transcode started in background", 
            id: v.id,
            sourceKey
        });

    } catch (e: any) {
        console.error(`[Batcher API] POST Exception:`, e);
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    }
}
