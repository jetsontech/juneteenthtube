import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { rm, readdir, mkdtemp } from "fs/promises";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import os from "os";

const sanitizeEnv = (val: string | undefined) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;
const regionEnv = sanitizeEnv(process.env.S3_REGION);
const isValidRegion = (r: string | undefined) => r && /^[a-z0-9-]+$/.test(r);
const region = (isValidRegion(regionEnv) && regionEnv !== "auto") ? regionEnv : "us-east-1";

const rawEndpoint = process.env.S3_ENDPOINT || "";
const urlMatch = rawEndpoint.match(/https?:\/\/[a-zA-Z0-9.-]+\.cloudflarestorage\.com/);
const cleanEndpoint = urlMatch ? urlMatch[0] : undefined;

const cleanCredential = (val: string | undefined) => val ? val.replace(/[^a-zA-Z0-9]/g, '') : "";
const accessKeyId = cleanCredential(process.env.S3_ACCESS_KEY_ID);
const secretAccessKey = cleanCredential(process.env.S3_SECRET_ACCESS_KEY);

export const S3 = new S3Client({
    region: region,
    endpoint: cleanEndpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const videoId = process.env.VIDEO_ID;
    const sourceUrl = process.env.VIDEO_URL;

    if (!videoId || !sourceUrl) {
        throw new Error("Missing VIDEO_ID or VIDEO_URL environment variables");
    }

    let sourceKey = sourceUrl;
    let isExternalUrl = false;
    
    if (sourceUrl.startsWith('http')) {
        const url = new URL(sourceUrl);
        // If it doesn't look like our R2 or a presigned URL, treat it as an external public URL
        if (!sourceUrl.includes("cloudflarestorage") && !sourceUrl.includes("r2.dev")) {
            isExternalUrl = true;
        } else {
            sourceKey = url.pathname.substring(1);
        }
    }

    // On GitHub Actions (Ubuntu), ffmpeg is pre-installed globally
    const ffmpegPath = "ffmpeg";

    const tempDir = await mkdtemp(join(os.tmpdir(), "gh-transcode-"));
    let inputPath = join(tempDir, "input");
    const hlsDir = join(tempDir, "hls");
    const outputM3u8 = join(hlsDir, "output.m3u8");

    try {
        console.log(`[GH Worker] Started HLS processing for videoId: ${videoId}`);
        
        const fs = require('fs');
        if (!fs.existsSync(hlsDir)) {
            fs.mkdirSync(hlsDir, { recursive: true });
        }

        if (isExternalUrl) {
            console.log(`[GH Worker] External public URL detected: ${sourceUrl}. Bypassing R2 download...`);
            inputPath = sourceUrl; // FFmpeg can read HTTP natively
        } else {
            console.log(`[GH Worker] Downloading source from R2 (Key: ${sourceKey})...`);
            const response = await S3.send(
                new GetObjectCommand({
                    Bucket: sanitizeEnv(process.env.S3_BUCKET_NAME)!,
                    Key: sourceKey,
                })
            );

            if (!response.Body) {
                throw new Error("Empty body returned from S3 source download");
            }

            await new Promise<void>((resolve, reject) => {
                const ws = createWriteStream(inputPath);
                // @ts-ignore
                response.Body.pipe(ws).on("finish", resolve).on("error", reject);
            });
        }

        console.log(`[GH Worker] Spawning FFmpeg...`);
        
        const exitCode = await new Promise<number>((resolve) => {
            const ffmpeg = spawn(ffmpegPath, [
                "-i", inputPath,
                "-profile:v", "main",
                "-pix_fmt", "yuv420p",
                "-crf", "23",
                "-preset", "fast",
                "-g", "48",
                "-keyint_min", "48",
                "-sc_threshold", "0",
                "-ac", "2",
                "-b:a", "128k",
                "-hls_time", "6",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", join(hlsDir, "output_%03d.ts"),
                "-y",
                outputM3u8
            ]);

            ffmpeg.stderr.on("data", (data) => {
                const logLine = data.toString().trim().split("\n").pop() || "";
                if (logLine) {
                    process.stdout.write(`\r[FFmpeg] ${logLine.substring(0, 80)}`);
                }
            });

            ffmpeg.on("close", (code) => {
                console.log(`\n[GH Worker] FFmpeg finished with exit code: ${code}`);
                resolve(code ?? -1);
            });

            ffmpeg.on("error", (err) => {
                console.error(`\n[GH Worker] FFmpeg process encountered an error:`, err);
                resolve(-99);
            });
        });

        if (exitCode !== 0) {
            throw new Error(`FFmpeg transcoding failed with exit code: ${exitCode}`);
        }

        if (!existsSync(outputM3u8)) {
            throw new Error("Output m3u8 file was not generated.");
        }

        console.log(`[GH Worker] Uploading HLS files to R2...`);
        const files = await readdir(hlsDir);
        const folderPrefix = `${videoId}/hls`;
        
        let m3u8PublicUrl = "";

        let s3Domain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || process.env.S3_PUBLIC_DOMAIN || rawEndpoint;
        if (s3Domain.includes("cloudflarestorage.com") && process.env.R2_PUBLIC_URL) {
             s3Domain = process.env.R2_PUBLIC_URL;
        } else if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
             s3Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        }

        for (const file of files) {
            const filePath = join(hlsDir, file);
            const s3Key = `${folderPrefix}/${file}`;
            const contentType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T';

            await S3.send(
                new PutObjectCommand({
                    Bucket: sanitizeEnv(process.env.S3_BUCKET_NAME)!,
                    Key: s3Key,
                    Body: createReadStream(filePath),
                    ContentType: contentType,
                })
            );
            
            if (file === "output.m3u8") {
                m3u8PublicUrl = `${s3Domain}/${s3Key}`;
            }
        }

        console.log(`[GH Worker] Updating Supabase...`);
        const { error: dbError } = await supabase
            .from("videos")
            .update({
                video_url_h264: m3u8PublicUrl,
                transcode_status: "completed",
            })
            .eq("id", videoId);

        if (dbError) throw dbError;

        console.log(`[GH Worker] SUCCESS: Video ${videoId} is now live!`);

    } catch (err: any) {
        console.error(`[GH Worker] FATAL ERROR during transcoding:`, err);
        try {
            await supabase.from("videos").update({ transcode_status: "failed" }).eq("id", videoId);
        } catch (e) {}
        process.exit(1);
    } finally {
        try {
            if (existsSync(tempDir)) {
                await rm(tempDir, { recursive: true, force: true });
            }
        } catch (cleanupErr) {}
    }
}

run();
