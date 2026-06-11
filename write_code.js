/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const code = `import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { spawn } from "child_process";
import { mkdir, rm } from "fs/promises";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export const maxDuration = 900;

const S3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  }
});

export async function POST(req) {
  const tempDir = join(tmpdir(), "transcode-" + randomUUID());
  try {
    const { sourceKey, videoId } = await req.json();
    console.log("--- WORKER START:", videoId);
    
    const ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
    await mkdir(tempDir, { recursive: true });
    const inputPath = join(tempDir, "input");
    const outputPath = join(tempDir, "output.mp4");

    // 1. Download
    const response = await S3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: sourceKey }));
    await new Promise((res, rej) => {
      const ws = createWriteStream(inputPath);
      response.Body.pipe(ws).on("finish", res).on("error", rej);
    });

    // 2. Transcode with Exit Code Capture
    console.log("--- FFMPEG STARTING...");
    const exitCode = await new Promise((res) => {
      const ffmpeg = spawn(ffmpegPath, ["-i", inputPath, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "28", "-y", outputPath]);
      
      ffmpeg.stderr.on("data", (data) => {
        // Log last few lines of FFmpeg output if needed
      });

      ffmpeg.on("close", (code) => {
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
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("--- WORKER FATAL ERROR:", e.message);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    setTimeout(async () => {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
      console.log("--- TEMP CLEANED");
    }, 30000);
  }
}
`;
fs.writeFileSync("src/app/api/transcode/route.ts", code);
console.log("SUCCESS: Transcoder updated with Exit Code Logging.");
