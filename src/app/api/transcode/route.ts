import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { handleTranscoding, supabase } from "./worker";

export const maxDuration = 300; // Allow long-running execution up to 5m (Hobby plan limit)

export async function POST(req: NextRequest) {
    try {
        const { sourceKey, videoId } = await req.json();

        if (!sourceKey || !videoId) {
            return NextResponse.json({ error: "Missing sourceKey or videoId" }, { status: 400 });
        }

        console.log(`[API POST] Received request. videoId: ${videoId}, sourceKey: ${sourceKey}`);

        // Update database to "processing" immediately
        const { error: dbError } = await supabase
            .from("videos")
            .update({
                transcode_status: "processing",
            })
            .eq("id", videoId);

        if (dbError) {
            console.error(`[API POST] DB processing status update failed for video: ${videoId}`, dbError);
            return NextResponse.json({ error: "Failed to update video transcode status to processing" }, { status: 500 });
        }

        // Initialize temp directory
        const tempDir = join(tmpdir(), "transcode-" + randomUUID());
        await mkdir(tempDir, { recursive: true });

        // Trigger transcoding workflow directly in the background and DO NOT await it.
        handleTranscoding(sourceKey, videoId, tempDir).catch((bgErr) => {
            console.error(`[API POST] Background task exception:`, bgErr);
        });

        // Return HTTP 200 immediately
        return NextResponse.json({
            success: true,
            message: "Transcoding process started in the background",
            videoId,
            status: "processing"
        });

    } catch (e: any) {
        console.error(`[API POST] Exception in route handler:`, e);
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    }
}
