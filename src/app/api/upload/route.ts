import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

// Generic S3 Client (Works for AWS, Cloudflare R2, Wasabi, DigitalOcean)
const sanitizeEnv = (val: string | undefined) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const regionEnv = sanitizeEnv(process.env.S3_REGION);
// Strict validation: must be alphanumeric (plus hyphens) to avoid garbage like 'region+"auto"'
const isValidRegion = (r: string | undefined) => r && /^[a-z0-9-]+$/.test(r);
const region = (isValidRegion(regionEnv) && regionEnv !== "auto") ? regionEnv : "us-east-1";

// Brute Force Endpoint Cleanup - Extract ONLY valid URL using regex
const rawEndpoint = process.env.S3_ENDPOINT || "";
const urlMatch = rawEndpoint.match(/https?:\/\/[a-zA-Z0-9.-]+\.cloudflarestorage\.com/);
const cleanEndpoint = urlMatch ? urlMatch[0] : undefined;

// Strict Credential Cleanup - Extract ONLY alphanumeric characters
const cleanCredential = (val: string | undefined) => val ? val.replace(/[^a-zA-Z0-9]/g, '') : "";
const accessKeyId = cleanCredential(process.env.S3_ACCESS_KEY_ID);
const secretAccessKey = cleanCredential(process.env.S3_SECRET_ACCESS_KEY);

const S3 = new S3Client({
    region: region,
    endpoint: cleanEndpoint, // e.g., https://<account_id>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
    // Prevent the SDK from adding checksum headers that R2 might not support in this context
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '');
        const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user?.user_metadata?.role === 'admin' || user?.role === 'admin';

        if (!isAdmin) {
            console.warn("Unauthorized API access attempt");
            return NextResponse.json({ error: "Unauthorized. Artist Network Premium feature." }, { status: 403 });
        }

        const { filename, contentType } = await req.json();

        if (!process.env.S3_ENDPOINT) {
            console.warn("Warning: S3_ENDPOINT is not defined. Uploads may fail if not using standard AWS.");
        }

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: "Missing filename or content-type" },
                { status: 400 }
            );
        }

        const bucketName = sanitizeEnv(process.env.S3_BUCKET_NAME);
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
        const publicDomain = sanitizeEnv(process.env.S3_PUBLIC_DOMAIN);
        if (publicDomain) {
            publicUrl = `${publicDomain}/${key}`;
        } else {
            publicUrl = `${cleanEndpoint}/${bucketName}/${key}`;
        }

        return NextResponse.json({ signedUrl, publicUrl, key });

    } catch (error: unknown) {
        console.error("S3 Presign Error:", error);

        // DEBUG: Return endpoint details in error
        const debugInfo = cleanEndpoint ? `Endpoint: [${cleanEndpoint}] (Code: ${cleanEndpoint.charCodeAt(cleanEndpoint.length - 1)})` : "No Endpoint";
        const errorMsg = error instanceof Error ? error.message : "Failed to generate upload URL";

        return NextResponse.json(
            { error: `${errorMsg} | DEBUG: ${debugInfo}` },
            { status: 500 }
        );
    }
}
