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

// Define types for Payload and S3 to avoid 'any'
interface UpdatePayload {
  video_url_h264: string;
  transcode_status: string;
  thumbnail_url?: string;
}

const S3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  }
});

// Helper to construct public URL
const getPublicUrl = (key: string) => {
  if (process.env.S3_PUBLIC_DOMAIN) {
    return `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
  }
  const endpoint = process.env.S3_ENDPOINT || "";
  const cleanEndpoint = endpoint.replace(/\/$/, "");
  return `${cleanEndpoint}/${process.env.S3_BUCKET_NAME}/${key}`;
};

export async function POST(req: NextRequest) {
  let videoId = "unknown";
  try {
    const { sourceKey, videoId: id } = await req.json();
    videoId = id;

    const tempDir = join(tmpdir(), "transcode-" + randomUUID());

    const runTranscoding = async (): Promise<boolean> => {
      try {
        console.log(`--- [${videoId}] START TRANSCODE JOB ---`);
        const ffmpegPath = ffmpegStatic || 'ffmpeg';

        await mkdir(tempDir, { recursive: true });
        const inputPath = join(tempDir, "input_video");
        const outputPath = join(tempDir, "output.mp4");
        const thumbPath = join(tempDir, "thumb.jpg");

        // 1. Download Video
        const response = await S3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: sourceKey }));
        if (!response.Body) throw new Error("S3 response body is empty");

        await new Promise<void>((res, rej) => {
          const ws = createWriteStream(inputPath);
          (response.Body as Readable).pipe(ws).on("finish", () => res()).on("error", rej);
        });

        // 2a. Generate Thumbnail
        let thumbSuccess = false;
        try {
          await new Promise < void > ((resolve, _reject) => { // Prefixed unused reject
            const thumbProc = spawn(ffmpegPath, [
              "-i", inputPath,
              "-ss", "00:00:01",
              "-vframes", "1",
              "-vf", "scale=640:-1",
              "-q:v", "2",
              "-y", thumbPath
            ]);

            thumbProc.on('close', (code) => {
              if (code === 0) {
                thumbSuccess = true;
                resolve();
              } else {
                resolve(); 
              }
            });

            thumbProc.on('error', () => resolve());
          });
        } catch (err) {
          console.warn("Thumbnail generation exception:", err);
        }

        // 2b. Transcode Video
        try {
          os.setPriority(os.constants.priority.PRIORITY_ABOVE_NORMAL);
        } catch (e) { /* ignore priority errors */ }

        const ffmpegPromise = new Promise<number | null>((res, rej) => {
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

          ffmpeg.on("close", (code) => res(code));
          ffmpeg.on("error", (err) => rej(err));
        });

        const TIMEOUT_MS = 280000;
        const timeoutPromise = new Promise<number>((_, rej) => {
          setTimeout(() => rej(new Error(`Transcoding timed out`)), TIMEOUT_MS);
        });

        const exitCode = await Promise.race([ffmpegPromise, timeoutPromise]);
        if (exitCode !== 0) throw new Error("FFMPEG failed");

        // 3. Upload Results
        const baseKey = sourceKey.replace(/\.[^/.]+$/, "");
        const h264Key = `${baseKey}_h264.mp4`;
        const thumbKey = `${baseKey}_thumb.jpg`;

        const uploads = [];
        uploads.push(
          S3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: h264Key,
            Body: createReadStream(outputPath),
            ContentType: "video/mp4"
          }))
        );

        let thumbPublicUrl: string | null = null;
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
        const updatePayload: UpdatePayload = {
          video_url_h264: h264PublicUrl,
          transcode_status: "completed"
        };

        if (thumbPublicUrl) {
          updatePayload.thumbnail_url = thumbPublicUrl;
        }

        const { error: dbError } = await supabase.from("videos").update(updatePayload).eq("id", videoId);
        if (dbError) throw dbError;

        return true;

      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`--- [${videoId}] FATAL ERROR:`, error.message);

        await supabase.from("videos").update({ transcode_status: "failed" }).eq("id", videoId);
        return false;
      } finally {
        try { os.setPriority(os.constants.priority.PRIORITY_NORMAL); } catch { }
        setTimeout(async () => {
          try { await rm(tempDir, { recursive: true, force: true }); } catch (cleanupError) { 
             console.error("Cleanup error:", cleanupError); 
          }
        }, 5000);
      }
    };

    const success = await runTranscoding();

    if (!success) {
      return NextResponse.json({ success: false, error: "Transcoding failed", videoId }, { status: 500 });
    }

    return NextResponse.json({ success: true, videoId });

  } catch (err) {
    console.error("Top-level error:", err);
    return NextResponse.json({ error: "Invocation failed" }, { status: 500 });
  }
}
