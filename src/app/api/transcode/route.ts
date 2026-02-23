import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { spawn } from "child_process";
import { mkdir, rm } from "fs/promises";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import os from "os";
import ffmpegStatic from "ffmpeg-static";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export const maxDuration = 300; // Vercel timeout configuration

const S3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  }
} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

// Helper to construct public URL (Replicates upload-multipart logic)
const getPublicUrl = (key: string) => {
  if (process.env.S3_PUBLIC_DOMAIN) {
    return `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
  }
  // Fallback to Endpoint/Bucket pattern
  const endpoint = process.env.S3_ENDPOINT || "";
  // Ensure we don't double slash if endpoint ends with slash
  const cleanEndpoint = endpoint.replace(/\/$/, "");
  return `${cleanEndpoint}/${process.env.S3_BUCKET_NAME}/${key}`;
};

export async function POST(req: NextRequest) {
  let videoId = "unknown";
  try {
    const { sourceKey, videoId: id } = await req.json();
    videoId = id;

    // Unique temp directory for this job
    const tempDir = join(tmpdir(), "transcode-" + randomUUID());

    // Define the heavy work as an async function
    const runTranscoding = async (): Promise<boolean> => {
      try {

        console.log(`--- [${videoId}] START TRANSCODE JOB ---`);
        console.log(`Source Key: ${sourceKey}`);

        // Cross-platform ffmpeg path (supports Linux/Vercel and Windows)
        // ffmpeg-static returns a string path to the binary
        const ffmpegPath = ffmpegStatic || 'ffmpeg';

        await mkdir(tempDir, { recursive: true });
        const inputPath = join(tempDir, "input_video"); // improved name
        const outputPath = join(tempDir, "output.mp4");
        const thumbPath = join(tempDir, "thumb.jpg");

        // 1. Download Video
        console.log(`--- [${videoId}] DOWNLOADING...`);
        const response = await S3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: sourceKey }));
        if (!response.Body) throw new Error("S3 response body is empty");

        await new Promise<void>((res, rej) => {
          const ws = createWriteStream(inputPath);
          (response.Body as Readable).pipe(ws).on("finish", () => res()).on("error", rej);
        });

        // 2a. Generate Thumbnail Step
        // We do this first as it is fast and provides immediate value even if transcode fails later
        console.log(`--- [${videoId}] GENERATING THUMBNAIL...`);
        let thumbSuccess = false;

        try {
          await new Promise<void>((resolve, reject) => {
            const thumbProc = spawn(ffmpegPath, [
              "-i", inputPath,
              "-ss", "00:00:01", // Capture at 1s to avoid black start frames
              "-vframes", "1",
              "-vf", "scale=640:-1", // Reasonable thumbnail size (width 640, keep aspect)
              "-q:v", "2", // High quality jpeg
              "-y", thumbPath
            ]);

            thumbProc.on('close', (code) => {
              if (code === 0) {
                thumbSuccess = true;
                resolve();
              } else {
                console.warn(`Thumbnail generation exited with code ${code}`);
                resolve(); // Resolve anyway to proceed
              }
            });

            thumbProc.on('error', (err) => {
              console.warn("Thumbnail generation error:", err);
              resolve();
            });
          });
        } catch (err) {
          console.warn("Thumbnail generation exception:", err);
        }

        // 2b. Transcode Video to H.264
        console.log(`--- [${videoId}] TRANSCODING TO H.264...`);

        // Increase process priority to prevent Windows throttling (optional)
        try {
          os.setPriority(os.constants.priority.PRIORITY_ABOVE_NORMAL);
        } catch (e) { }

        // Prepare FFMPEG Promise
        const ffmpegPromise = new Promise<number | null>((res, rej) => {
          // Command optimized for compatibility and speed
          // -c:v libx264: H.264 Video Codec (Compat king)
          // -pix_fmt yuv420p: Ensure broad player support (QuickTime, Chrome, Android)
          // -preset ultrafast: Speed over compression efficiency (vital for serverless timeout)
          // -crf 28: Reasonable quality for web
          // -vf scale=...: Downscale to 720p max width if larger
          const ffmpeg = spawn(ffmpegPath,
            [
              "-i", inputPath,
              "-c:v", "libx264",
              "-pix_fmt", "yuv420p",
              "-preset", "ultrafast",
              "-crf", "28",
              "-vf", "scale='min(1280,iw)':-2",
              "-y", outputPath
            ],
            { stdio: ['ignore', 'inherit', 'inherit'] }
          );


          ffmpeg.on("close", (code) => {
            console.log(`--- [${videoId}] FFMPEG EXIT: ${code}`);
            res(code);
          });


          ffmpeg.on("error", (err) => {
            console.error("FFmpeg spawn error:", err);
            rej(err);
          });
        });

        // TIMEOUT SAFETY: Kill process if it takes too long
        // Vercel Pro Function Limit is 300s
        const TIMEOUT_MS = 280000; // 4.6 minutes (slightly under 300s limit)


        const timeoutPromise = new Promise<number>((_, rej) => {
          setTimeout(() => {
            rej(new Error(`Transcoding timed out after ${TIMEOUT_MS}ms`));
          }, TIMEOUT_MS);
        });

        // Race ffmpeg against timeout
        const exitCode = await Promise.race([ffmpegPromise, timeoutPromise]);

        if (exitCode !== 0) throw new Error("FFMPEG crashed or failed with code " + exitCode);
        if (!existsSync(outputPath)) throw new Error("Output file missing after transcode");

        // 3. Upload Results
        // Clean up filename (remove extension from source key)
        const baseKey = sourceKey.replace(/\.[^/.]+$/, "");
        const h264Key = `${baseKey}_h264.mp4`;
        const thumbKey = `${baseKey}_thumb.jpg`;

        console.log(`--- [${videoId}] UPLOADING RESULTS...`);

        const uploads = [];

        // Upload Video
        uploads.push(
          S3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: h264Key,
            Body: createReadStream(outputPath),
            ContentType: "video/mp4"
          }))
        );

        // Upload Thumbnail (if generated)
        let thumbPublicUrl = null;
        if (thumbSuccess && existsSync(thumbPath)) {
          uploads.push(
            S3.send(new PutObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: thumbKey,
              Body: createReadStream(thumbPath),
              ContentType: "image/jpeg"
            })).then(() => {
              thumbPublicUrl = getPublicUrl(thumbKey);
            })
          );
        }

        await Promise.all(uploads);

        // 4. Update Database
        const h264PublicUrl = getPublicUrl(h264Key);

        console.log(`--- [${videoId}] UPDATING DB...`);

        const updatePayload: any = {
          video_url_h264: h264PublicUrl, // Store FULL URL
          transcode_status: "completed"
        };

        if (thumbPublicUrl) {
          updatePayload.thumbnail_url = thumbPublicUrl;
        }

        const { error } = await supabase.from("videos").update(updatePayload).eq("id", videoId);

        if (error) throw error;
        console.log(`--- [${videoId}] JOB COMPLETE (Success)`);
        return true;


      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`--- [${videoId}] FATAL ERROR:`, error.message);
        console.error(`Stack trace:`, error.stack);

        // Update status to failed with more context if possible
        await supabase.from("videos").update({
          transcode_status: "failed",
          // We could add a 'transcode_error' column if it existed, but for now we just log
        }).eq("id", videoId);
        return false;


      } finally {
        // Cleanup Temp
        try { os.setPriority(os.constants.priority.PRIORITY_NORMAL); } catch { }

        // Delay cleanup slightly to ensure streams close
        setTimeout(async () => {
          try {
            await rm(tempDir, { recursive: true, force: true });
            console.log(`--- [${videoId}] CLEARED TEMP`);
          } catch (e) { console.error("Temp cleanup failed", e); }
        }, 5000);
      }
    };

    // Await the transcoding task within the request handler
    const success = await runTranscoding();

    if (!success) {
      return NextResponse.json({
        success: false,
        error: "Transcoding failed",
        videoId
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Transcoding completed successfully",
      videoId
    });


  } catch (error) {
    console.error("Transcode Route Top-Level Error:", error);
    return NextResponse.json({ error: "Transcoding invocation failed" }, { status: 500 });
  }
}
