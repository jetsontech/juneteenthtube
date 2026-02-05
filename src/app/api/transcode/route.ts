import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import { createWriteStream, createReadStream } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";

// Configure FFmpeg path
if (ffmpegInstaller) {
    ffmpeg.setFfmpegPath(ffmpegInstaller);
}

// S3/R2 Client Configuration (reuse from upload routes)
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

const S3 = new S3Client({
    region: region,
    endpoint: cleanEndpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

interface TranscodeRequest {
    sourceKey: string;      // Original HEVC file key in R2
    videoId: string;        // Supabase video ID for status updates
}

// Helper: Stream S3 object to file
async function downloadFromS3(key: string, destPath: string): Promise<void> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    const response = await S3.send(command);
    const body = response.Body as Readable;

    return new Promise((resolve, reject) => {
        const writeStream = createWriteStream(destPath);
        body.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

// Helper: Upload file to S3
async function uploadToS3(filePath: string, key: string, contentType: string): Promise<string> {
    const fileStream = createReadStream(filePath);
    const fileBuffer = await streamToBuffer(fileStream);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await S3.send(command);

    // Return public URL
    if (process.env.S3_PUBLIC_DOMAIN) {
        return `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
    }
    return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
}

// Helper: Convert stream to buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

// Configure Max Duration (try 60s, Vercel limit depends on plan)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Helper: Run FFmpeg transcoding
async function transcodeToH264(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // FFmpeg command for HEVC to H.264 conversion
        // -c:v libx264: Use H.264 codec
        // -crf 26: Slightly lower quality for speed (default 23)
        // -preset ultrafast: Maximum transcoding speed
        // -c:a aac: Convert audio (fast)
        // -movflags +faststart: Enable progressive download
        const ffmpeg = spawn(ffmpegInstaller || 'ffmpeg', [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-crf', '26',
            '-preset', 'ultrafast',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',  // Overwrite output
            outputPath
        ]);

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
            }
        });

        ffmpeg.on('error', (err) => {
            reject(new Error(`FFmpeg spawn error: ${err.message}`));
        });
    });
}

// Helper: Check if file is likely HEVC/H.265
function isLikelyHEVC(filename: string, contentType?: string): boolean {
    const hevcExtensions = ['.hevc', '.heic', '.mov', '.mkv'];
    const hevcMimeTypes = ['video/hevc', 'video/x-hevc', 'video/quicktime'];

    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const isHevcExt = hevcExtensions.includes(ext);
    const isHevcMime = contentType ? hevcMimeTypes.some(t => contentType.includes(t)) : false;

    // .mov files from iPhone are typically HEVC, but we should transcode to be safe
    return isHevcExt || isHevcMime;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await req.json() as TranscodeRequest;
        const { sourceKey, videoId } = body;

        if (!sourceKey || !videoId) {
            return NextResponse.json(
                { error: "Missing sourceKey or videoId" },
                { status: 400 }
            );
        }

        if (!BUCKET_NAME) {
            return NextResponse.json(
                { error: "Server Configuration Error: Missing Bucket" },
                { status: 500 }
            );
        }

        // Create temp directory for transcoding
        const tempDir = join(tmpdir(), 'transcode-' + randomUUID());
        await mkdir(tempDir, { recursive: true });

        const inputPath = join(tempDir, 'input');
        const outputPath = join(tempDir, 'output.mp4');

        try {
            console.log(`[Transcode] Starting download of ${sourceKey}`);

            // 1. Download source file from R2
            await downloadFromS3(sourceKey, inputPath);
            console.log(`[Transcode] Download complete, starting transcoding`);

            // 2. Transcode to H.264
            await transcodeToH264(inputPath, outputPath);
            console.log(`[Transcode] Transcoding complete, uploading result`);

            // 3. Upload transcoded file to R2
            const h264Key = sourceKey.replace(/\.[^.]+$/, '_h264.mp4');
            const publicUrl = await uploadToS3(outputPath, h264Key, 'video/mp4');

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[Transcode] Complete in ${duration}s: ${publicUrl}`);

            return NextResponse.json({
                success: true,
                h264Url: publicUrl,
                h264Key: h264Key,
                videoId: videoId,
                durationSeconds: parseFloat(duration)
            });

        } finally {
            // Cleanup temp files
            try {
                await unlink(inputPath).catch(() => { });
                await unlink(outputPath).catch(() => { });
            } catch {
                // Ignore cleanup errors
            }
        }

    } catch (error) {
        console.error("[Transcode] Error:", error);
        const errorMsg = error instanceof Error ? error.message : "Transcoding failed";

        return NextResponse.json(
            { error: errorMsg },
            { status: 500 }
        );
    }
}

// Export helper for use in VideoContext
export { isLikelyHEVC };
