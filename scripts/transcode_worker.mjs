import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { mkdir, rm, readdir, stat } from "fs/promises";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const S3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ""
    }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "juneteenthtube";

// Poll delay (5 seconds)
const POLL_DELAY_MS = 5000;

// Find FFmpeg binary
function getFFmpegPath() {
    // 1. Try global ffmpeg
    return "ffmpeg";
}

async function downloadFile(bucket, key, localPath) {
    const response = await S3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return new Promise((resolve, reject) => {
        const ws = createWriteStream(localPath);
        response.Body.pipe(ws)
            .on("finish", resolve)
            .on("error", reject);
    });
}

async function uploadFile(bucket, key, localPath, contentType) {
    await S3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: createReadStream(localPath),
        ContentType: contentType
    }));
}

async function processVideo(video) {
    console.log(`\n========================================`);
    console.log(`[WORKER] Starting transcode for video: "${video.title}" (ID: ${video.id})`);
    console.log(`========================================`);

    const tempDir = join(tmpdir(), "transcode-" + randomUUID());
    const hlsOutDir = join(tempDir, "hls");

    try {
        // Create temp dirs
        await mkdir(tempDir, { recursive: true });
        await mkdir(hlsOutDir, { recursive: true });

        const inputPath = join(tempDir, "input.mp4");
        
        // Resolve source key from the video_url (could be full URL or just the key)
        let sourceKey = video.video_url;
        if (sourceKey.startsWith("http")) {
            sourceKey = sourceKey.split("/").pop();
        }
        
        console.log(`[WORKER] Downloading raw source file "${sourceKey}"...`);
        await downloadFile(BUCKET_NAME, sourceKey, inputPath);
        console.log(`[WORKER] Downloaded to ${inputPath}`);

        // Run FFmpeg
        console.log(`[WORKER] Running FFmpeg transcoding to HLS...`);
        const ffmpegPath = getFFmpegPath();
        const playlistPath = join(hlsOutDir, "playlist.m3u8");
        const segmentPattern = join(hlsOutDir, "segment_%03d.ts");

        const args = [
            "-i", inputPath,
            "-codec:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "ultrafast",
            "-crf", "26",
            "-codec:a", "aac",
            "-b:a", "128k",
            "-hls_time", "6",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segmentPattern,
            playlistPath
        ];

        const exitCode = await new Promise((resolve) => {
            const proc = spawn(ffmpegPath, args);

            proc.stderr.on("data", (data) => {
                // You can log stdout/stderr if you want detail, let's keep it compact
                const str = data.toString();
                if (str.includes("Error") || str.includes("Failed")) {
                    console.log(`[FFmpeg Error/Warning]: ${str.trim()}`);
                }
            });

            proc.on("close", (code) => {
                resolve(code);
            });
            
            proc.on("error", (err) => {
                console.error("[WORKER] FFmpeg execution error:", err);
                resolve(-1);
            });
        });

        if (exitCode !== 0) {
            throw new Error(`FFmpeg exited with code ${exitCode}`);
        }

        if (!existsSync(playlistPath)) {
            throw new Error("FFmpeg HLS output files are missing");
        }

        console.log(`[WORKER] FFmpeg transcoding finished successfully.`);

        // Upload all HLS files
        const hlsFiles = await readdir(hlsOutDir);
        console.log(`[WORKER] Uploading ${hlsFiles.length} HLS files to Cloudflare R2...`);

        for (const file of hlsFiles) {
            const localFile = join(hlsOutDir, file);
            const r2Key = `hls/${video.id}/${file}`;
            const contentType = file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
            
            console.log(`   Uploading: ${file} -> R2 Key: ${r2Key}`);
            await uploadFile(BUCKET_NAME, r2Key, localFile, contentType);
        }

        // Update database
        const h264Key = `hls/${video.id}/playlist.m3u8`;
        console.log(`[WORKER] Transcode upload completed. Updating Supabase video record...`);
        
        const { error: updateErr } = await supabase
            .from("videos")
            .update({
                video_url_h264: h264Key,
                transcode_status: "completed"
            })
            .eq("id", video.id);

        if (updateErr) throw updateErr;

        console.log(`[WORKER] Successfully completed transcoding for video: ${video.id}`);
    } catch (err) {
        console.error(`[WORKER] Fatal error transcoding video ${video.id}:`, err);
        
        // Mark as failed in DB
        await supabase
            .from("videos")
            .update({ transcode_status: "failed" })
            .eq("id", video.id)
            .catch(dbErr => console.error("[WORKER] Failed to mark video status as failed in DB:", dbErr));
    } finally {
        // Cleanup local temp directory
        await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        console.log(`[WORKER] Cleaned up temporary directory: ${tempDir}`);
    }
}

async function pollQueue() {
    try {
        // Query Supabase for pending video transcode jobs
        const { data, error } = await supabase
            .from("videos")
            .select("id, title, video_url, transcode_status")
            .eq("transcode_status", "pending")
            .limit(1);

        if (error) {
            console.error("[WORKER] Error polling queue:", error.message);
            return;
        }

        if (data && data.length > 0) {
            const video = data[0];
            
            // Optimistic Locking: immediately set status to processing
            const { data: updated, error: lockErr } = await supabase
                .from("videos")
                .update({ transcode_status: "processing" })
                .eq("id", video.id)
                .eq("transcode_status", "pending")
                .select();

            if (lockErr) {
                console.error("[WORKER] Error claiming video job:", lockErr.message);
                return;
            }

            // If we successfully claimed it
            if (updated && updated.length > 0) {
                await processVideo(video);
            }
        }
    } catch (err) {
        console.error("[WORKER] Unexpected worker poll error:", err);
    }
}

async function startWorker() {
    console.log("==================================================");
    console.log("    JUNETEENTHTUBE HLS TRANSCODING WORKER ACTIVED ");
    console.log("==================================================");
    console.log(`Polling Supabase for "pending" transcode jobs every ${POLL_DELAY_MS / 1000}s...`);

    while (true) {
        await pollQueue();
        await new Promise(res => setTimeout(res, POLL_DELAY_MS));
    }
}

startWorker();
