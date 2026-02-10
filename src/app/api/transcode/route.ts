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
export const maxDuration = 300;

const S3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
  }
} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

export async function POST(req: NextRequest) {
  const { sourceKey, videoId } = await req.json();
  const tempDir = join(tmpdir(), "transcode-" + randomUUID());

  // Define the heavy work as an async background task
  const runTranscoding = async () => {
    try {
      console.log("--- BACKGROUND WORKER START:", videoId);

      // Cross-platform ffmpeg path (supports Linux/Vercel and Windows)
      const ffmpegPath = ffmpegStatic || 'ffmpeg';
      await mkdir(tempDir, { recursive: true });
      const inputPath = join(tempDir, "input");
      const outputPath = join(tempDir, "output.mp4");

      // 1. Download
      console.log(`--- DOWNLOADING ${sourceKey} FOR ${videoId}`);
      const response = await S3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: sourceKey }));
      if (!response.Body) throw new Error("S3 response body is empty");

      await new Promise<void>((res, rej) => {
        const ws = createWriteStream(inputPath);
        (response.Body as Readable).pipe(ws).on("finish", () => res()).on("error", rej);
      });

      // 2. Transcode with Exit Code Capture
      console.log("--- FFMPEG STARTING...");

      // Increase process priority to prevent Windows throttling
      try {
        os.setPriority(os.constants.priority.PRIORITY_ABOVE_NORMAL);
      } catch (e: unknown) {
        console.warn("Could not set process priority:", e instanceof Error ? e.message : String(e));
      }

      const exitCode = await new Promise<number | null>((res) => {
        // detached: true and unref() allow the process to survive if the parent is killed
        // Redirecting stdio to 'ignore' is often needed when detaching
        const ffmpeg = spawn(ffmpegPath,
          ["-i", inputPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "28", "-y", outputPath],
          {
            detached: true,
            stdio: 'ignore'
          }
        );

        ffmpeg.unref();

        ffmpeg.on("close", (code: number | null) => {
          console.log("--- FFMPEG FINISHED WITH EXIT CODE:", code);
          res(code);
        });
      });

      if (exitCode !== 0) throw new Error("FFMPEG crashed with code " + exitCode);
      if (!existsSync(outputPath)) throw new Error("Output file missing after transcode");

      // 3. Upload
      const h264Key = sourceKey.split(".")[0] + "_h264.mp4";
      console.log("--- UPLOADING TO S3...");
      await S3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: h264Key,
        Body: createReadStream(outputPath),
        ContentType: "video/mp4"
      }));

      // 4. Update Database
      const { error } = await supabase.from("videos").update({
        video_url_h264: h264Key,
        transcode_status: "completed"
      }).eq("id", videoId);

      if (error) throw error;
      console.log("--- FULL SUCCESS FOR:", videoId);

    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error("--- WORKER FATAL ERROR:", error.message);
      // Ensure we update status to failed in DB
      await supabase.from("videos").update({ transcode_status: "failed" }).eq("id", videoId);
    } finally {
      // Return priority to normal if possible
      try {
        os.setPriority(os.constants.priority.PRIORITY_NORMAL);
      } catch { }

      setTimeout(async () => {
        await rm(tempDir, { recursive: true, force: true }).catch(() => { });
        console.log("--- TEMP CLEANED");
      }, 30000);
    }
  };

  // Await the transcoding task so the serverless function doesn't terminate immediately
  // Note: This is subject to Vercel's execution timeout (e.g., 10s-60s)
  try {
    await runTranscoding();
    return NextResponse.json({
      success: true,
      message: "Transcoding completed",
      videoId
    });
  } catch (error) {
    console.error("Transcode Route Error:", error);
    return NextResponse.json({ error: "Transcoding failed" }, { status: 500 });
  }
}
