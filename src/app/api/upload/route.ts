import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Generic S3 Client (Works for AWS, Cloudflare R2, Wasabi, DigitalOcean)
const S3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT, // e.g., https://<account_id>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    // Prevent the SDK from adding checksum headers that R2 might not support in this context
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "Missing filename or content-type" },
                { status: 400 }
            );
        }

        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            return NextResponse.json(
                { error: "Server Configuration Error: Missing Bucket Name" },
                { status: 500 }
            );
        }

        // Clean filename
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `${Date.now()}-${sanitizedFilename}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: contentType,
        });

        // Generate Presigned URL (valid for 1 hour)
        // We do NOT manually strip params anymore as that breaks the signature.
        const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });

        // Determine Public URL
        let publicUrl = "";
        if (process.env.S3_PUBLIC_DOMAIN) {
            publicUrl = `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
        } else {
            publicUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${key}`;
        }

        return NextResponse.json({ signedUrl, publicUrl, key });

    } catch (error: any) {
        console.error("S3 Presign Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}
