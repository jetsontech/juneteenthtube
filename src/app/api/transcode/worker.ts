import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { rm } from "fs/promises";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// Env Sanitizers (identical to S3 uploads configuration for reliability)
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Executes the entire transcoding lifecycle (download, FFmpeg spawn, upload, DB update)
 * in the background completely decoupled from the HTTP response handler.
 */
export async function handleTranscoding(sourceKey: string, videoId: string, tempDir: string) {
    const isWindows = process.platform === "win32";
    const ffmpegPath = path.join(
        process.cwd(),
        "node_modules",
        "ffmpeg-static",
        isWindows ? "ffmpeg.exe" : "ffmpeg"
    );

    const inputPath = join(tempDir, "input");
    const outputPath = join(tempDir, "output.mp4");
    const h264Key = sourceKey.split(".")[0] + "_h264.mp4";

    try {
        console.log(`[Transcoder] Started background processing for videoId: ${videoId}, sourceKey: ${sourceKey}`);

        // 1. Download source from S3
        console.log(`[Transcoder] Downloading source file to: ${inputPath}`);
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
            response.Body.pipe(ws)
                .on("finish", resolve)
                .on("error", reject);
        });

        // 2. Transcode with FFmpeg
        console.log(`[Transcoder] Spawning FFmpeg... Binary path: ${ffmpegPath}`);
        if (!existsSync(ffmpegPath)) {
            throw new Error(`FFmpeg binary not found at computed path: ${ffmpegPath}`);
        }

        const exitCode = await new Promise<number>((resolve) => {
            const ffmpeg = spawn(ffmpegPath, [
                "-i", inputPath,
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "ultrafast",
                "-crf", "28",
                "-y",
                outputPath
            ]);

            ffmpeg.stderr.on("data", (data) => {
                const logLine = data.toString().trim().split("\n").pop() || "";
                if (logLine) {
                    console.log(`[FFmpeg Progress] ${logLine.substring(0, 120)}`);
                }
            });

            ffmpeg.on("close", (code) => {
                console.log(`[Transcoder] FFmpeg closed with exit code: ${code}`);
                resolve(code ?? -1);
            });

            ffmpeg.on("error", (err) => {
                console.error(`[Transcoder] FFmpeg process encountered an error:`, err);
                resolve(-99);
            });
        });

        if (exitCode !== 0) {
            throw new Error(`FFmpeg transcoding failed with exit code: ${exitCode}`);
        }

        if (!existsSync(outputPath)) {
            throw new Error("Output transcoded file was not generated.");
        }

        // 3. Upload output to S3
        console.log(`[Transcoder] Uploading transcoded H.264 file to key: ${h264Key}`);
        await S3.send(
            new PutObjectCommand({
                Bucket: sanitizeEnv(process.env.S3_BUCKET_NAME)!,
                Key: h264Key,
                Body: createReadStream(outputPath),
                ContentType: "video/mp4",
            })
        );

        // 4. Update Supabase DB
        console.log(`[Transcoder] Updating Supabase database status to completed`);
        const { error: dbError } = await supabase
            .from("videos")
            .update({
                video_url_h264: h264Key,
                transcode_status: "completed",
            })
            .eq("id", videoId);

        if (dbError) {
            throw dbError;
        }

        console.log(`[Transcoder] SUCCESS: Transcoding and database sync completed for video: ${videoId}`);

    } catch (err: any) {
        console.error(`[Transcoder] FATAL ERROR during transcoding lifecycle for video: ${videoId}`, err);

        // Explicitly update database status to "failed" on any caught errors
        try {
            await supabase
                .from("videos")
                .update({
                    transcode_status: "failed",
                })
                .eq("id", videoId);
            console.log(`[Transcoder] Marked video ${videoId} as failed in database`);
        } catch (dbUpdateError) {
            console.error(`[Transcoder] Failed to write failure status to DB:`, dbUpdateError);
        }

    } finally {
        // Safe directory clean up after a 10s delay to let file system locks release
        setTimeout(async () => {
            try {
                if (existsSync(tempDir)) {
                    await rm(tempDir, { recursive: true, force: true });
                    console.log(`[Transcoder] Temporary files deleted: ${tempDir}`);
                }
            } catch (cleanupErr) {
                console.error(`[Transcoder] Directory cleanup failed for path ${tempDir}:`, cleanupErr);
            }
        }, 10000);
    }
}
