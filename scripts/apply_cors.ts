import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
});

async function applyCors() {
    console.log("🌊 Applying CORS Configuration to R2...");
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
        throw new Error("Missing S3_BUCKET_NAME in .env.local");
    }

    // Config matching r2_cors_config.json but in SDK format
    const corsRules = [
        {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedOrigins: [
                "*"
            ],
            ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
            MaxAgeSeconds: 3600
        }
    ];

    try {
        const command = new PutBucketCorsCommand({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: corsRules
            }
        });

        await client.send(command);
        console.log("✅ CORS Configuration successfully applied!");
        console.log("   - Allowed Origins:", corsRules[0].AllowedOrigins.join(", "));
        console.log("   - Allowed Methods:", corsRules[0].AllowedMethods.join(", "));

    } catch (err: any) {
        console.error("❌ Failed to apply CORS:", err.message);
        if (err.$metadata) console.error("   Request ID:", err.$metadata.requestId);
    }
}

applyCors();
