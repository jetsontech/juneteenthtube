import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "dotenv/config";

// Read from .env.local
const sanitizeEnv = (val: string | undefined) => val ? val.replace(/^['\"]+|['\"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const rawEndpoint = process.env.S3_ENDPOINT || "";
const urlMatch = rawEndpoint.match(/https?:\/\/[a-zA-Z0-9.-]+\.cloudflarestorage\.com/);
const cleanEndpoint = urlMatch ? urlMatch[0] : undefined;

const cleanCredential = (val: string | undefined) => val ? val.replace(/[^a-zA-Z0-9]/g, '') : "";

const config = {
    endpoint: cleanEndpoint,
    region: "us-east-1",
    accessKeyId: cleanCredential(process.env.S3_ACCESS_KEY_ID),
    secretAccessKey: cleanCredential(process.env.S3_SECRET_ACCESS_KEY),
    bucketName: sanitizeEnv(process.env.S3_BUCKET_NAME),
};

console.log("=== R2 Upload Test ===");
console.log("Endpoint:", config.endpoint);
console.log("Region:", config.region);
console.log("Access Key Length:", config.accessKeyId?.length);
console.log("Secret Key Length:", config.secretAccessKey?.length);
console.log("Bucket Name:", config.bucketName);
console.log("");

if (!config.endpoint) {
    console.error("ERROR: No valid endpoint found!");
    process.exit(1);
}

const S3 = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
    },
});

async function testUpload() {
    try {
        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: "test-upload-" + Date.now() + ".txt",
            ContentType: "text/plain",
        });

        console.log("Generating presigned URL...");
        const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
        console.log("SUCCESS! Signed URL generated:");
        console.log(signedUrl.substring(0, 100) + "...");

        // Try to actually upload
        console.log("\nAttempting actual upload...");
        const response = await fetch(signedUrl, {
            method: "PUT",
            body: "Test content from diagnostic script",
            headers: { "Content-Type": "text/plain" },
        });

        console.log("Upload Response Status:", response.status);
        if (response.ok) {
            console.log("✅ UPLOAD SUCCESSFUL!");
        } else {
            const text = await response.text();
            console.log("Upload Failed:", text);
        }

    } catch (error: unknown) {
        console.error("ERROR:", (error as Error).message);
        console.error("Full Error:", error);
    }
}

testUpload();
