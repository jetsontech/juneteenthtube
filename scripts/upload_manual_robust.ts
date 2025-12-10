import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load Env
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const S3_ENDPOINT = process.env.S3_ENDPOINT!;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID!;
const S3_SECRET = process.env.S3_SECRET_ACCESS_KEY!;
const S3_BUCKET = process.env.S3_BUCKET_NAME!;
const S3_PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN!;

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB (S3 Min is 5MB)

async function uploadFile(filePath: string) {
    let uploadId: string | undefined;
    const key = `${Date.now()}-${path.basename(filePath).replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const s3 = new S3Client({
        region: "auto",
        endpoint: S3_ENDPOINT,
        credentials: {
            accessKeyId: S3_ACCESS_KEY,
            secretAccessKey: S3_SECRET,
        },
    });

    try {
        console.log(`🛡️  Starting ROBUST Manual Upload: ${filePath}`);
        const stats = fs.statSync(filePath);
        const totalSize = stats.size;
        const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

        // 1. Initiate
        console.log("➡️  Initializing Multipart Upload...");
        const contentType = filePath.toLowerCase().endsWith(".mp4") ? "video/mp4" : "video/quicktime";

        const createRes = await s3.send(new CreateMultipartUploadCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: contentType,
        }));
        uploadId = createRes.UploadId;
        console.log(`🔑 Upload ID: ${uploadId}`);

        const completedParts: { PartNumber: number; ETag: string }[] = [];
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(CHUNK_SIZE);

        console.log(`ℹ️  Total Parts: ${totalParts}`);

        // 2. Upload Loop
        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const byteCount = end - start;

            fs.readSync(fd, buffer, 0, byteCount, start);
            const chunkData = buffer.subarray(0, byteCount); // Slice relevant data

            let uploaded = false;
            let attempts = 0;

            // Infinite Retry Loop for this chunk
            while (!uploaded) {
                try {
                    attempts++;
                    process.stdout.write(`\r🚀 Part ${partNumber}/${totalParts} [${(partNumber / totalParts * 100).toFixed(0)}%] (Attempt ${attempts})`);

                    const uploadPartRes = await s3.send(new UploadPartCommand({
                        Bucket: S3_BUCKET,
                        Key: key,
                        UploadId: uploadId,
                        PartNumber: partNumber,
                        Body: chunkData,
                        ContentLength: byteCount,
                    }));

                    completedParts.push({
                        PartNumber: partNumber,
                        ETag: uploadPartRes.ETag!,
                    });
                    uploaded = true;

                } catch (err: any) {
                    console.log(`\n⚠️  Chunk Failed (Attempt ${attempts}): ${err.message}`);
                    console.log("   ♻️  Retrying in 2 seconds...");
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }
        fs.closeSync(fd);
        console.log("\n✅ All Parts Uploaded.");

        // 3. Complete
        console.log("🏁 Finalizing on Cloud...");
        await s3.send(new CompleteMultipartUploadCommand({
            Bucket: S3_BUCKET,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: completedParts },
        }));

        // 4. Save to DB
        const publicUrl = `${S3_PUBLIC_DOMAIN}/${key}`;
        console.log("💾 Saving to Database...");
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data, error } = await supabase
            .from('videos')
            .insert([
                {
                    title: path.basename(filePath).replace(/\.[^/.]+$/, "") + " (MP4)",
                    video_url: publicUrl,
                    thumbnail_url: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                    duration: "Unknown"
                }
            ])
            .select()
            .single();

        if (error) console.error("DB Error:", error.message);
        else console.log("🎉 SUCCESS! Video Created:", data.id);

    } catch (err: any) {
        console.error("\n❌ FATAL ERROR:", err.message);
        if (uploadId) {
            console.log("⚠️  Attempting to abort upload to save costs...");
            await s3.send(new AbortMultipartUploadCommand({ Bucket: S3_BUCKET, Key: key, UploadId: uploadId }));
        }
    }
}

const targetFile = process.argv[2] || "upload_target.mov";
uploadFile(targetFile);
