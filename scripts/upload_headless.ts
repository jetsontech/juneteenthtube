import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";
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

async function uploadFile(filePath: string) {
    try {
        console.log(`🚀 Starting headless upload for: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        console.log(`📦 File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // 1. Initialize Supabase
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        // 2. Initialize S3 with HARDENED options
        // We disable Keep-Alive to prevent SSL synchronization errors on long uploads
        const requestHandler = new NodeHttpHandler({
            httpsAgent: new Agent({
                keepAlive: false,
                maxSockets: 1
            }),
            connectionTimeout: 300000, // 5 minutes
            socketTimeout: 300000,
        });

        const s3 = new S3Client({
            region: "auto",
            endpoint: S3_ENDPOINT,
            credentials: {
                accessKeyId: S3_ACCESS_KEY,
                secretAccessKey: S3_SECRET,
            },
            requestHandler: requestHandler,
            maxAttempts: 5, // Retry up to 5 times per chunk
        });

        // 3. Upload to S3 (Multipart with Small Chunks)
        const filename = path.basename(filePath);
        const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        console.log("☁️  Starting Robust Multipart Upload to S3...");
        console.log("ℹ️  Config: 5MB Chunks, No Keep-Alive, 5 Retries");

        const fileStream = fs.createReadStream(filePath);

        const parallelUploads3 = new Upload({
            client: s3,
            params: {
                Bucket: S3_BUCKET,
                Key: key,
                Body: fileStream,
                ContentType: "video/quicktime",
            },
            queueSize: 1, // Strictly sequential
            partSize: 5 * 1024 * 1024, // 5MB (Minimum allowed, safest)
        });

        parallelUploads3.on("httpUploadProgress", (progress) => {
            if (progress.loaded && progress.total) {
                const pct = Math.round((progress.loaded / progress.total) * 100);
                console.log(`🚀 Uploading: ${pct}% (${(progress.loaded / 1024 / 1024).toFixed(1)} MB)`);
            }
        });

        await parallelUploads3.done();
        console.log("\n✅ S3 Multipart Upload Complete.");

        // 4. Determine Public URL
        const publicUrl = `${S3_PUBLIC_DOMAIN}/${key}`;
        console.log(`🔗 URL: ${publicUrl}`);

        // 5. Insert into Supabase
        console.log("💾 Saving to Database...");
        const { data, error } = await supabase
            .from('videos')
            .insert([
                {
                    title: filename.replace(/\.[^/.]+$/, ""),
                    video_url: publicUrl,
                    thumbnail_url: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                    duration: "Unknown"
                }
            ])
            .select()
            .single();

        if (error) throw new Error(`Supabase Insert Failed: ${error.message}`);

        console.log("🎉 SUCCESS! Video is live.");
        console.log("🆔 Video ID:", data.id);

    } catch (err: any) {
        console.error("❌ Error:", err.message);
        console.error(err);
    }
}

// Run
const targetFile = process.argv[2] || "upload_target.mov";
uploadFile(targetFile);
