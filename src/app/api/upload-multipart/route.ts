
import { NextRequest, NextResponse } from "next/server";
import {
    S3Client,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
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
    endpoint: cleanEndpoint,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
    // Prevent checksum issues with R2
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_NAME = sanitizeEnv(process.env.S3_BUCKET_NAME);

interface UploadPart {
    ETag: string;
    PartNumber: number;
}

interface MultipartRequestBody {
    action: 'create' | 'sign-part' | 'complete';
    filename?: string;
    contentType?: string;
    key?: string;
    uploadId?: string;
    partNumber?: number;
    parts?: UploadPart[];
}

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

        const body = await req.json() as MultipartRequestBody;
        const { action } = body;
        console.log(`API/Upload-Multipart Request: Action=${action}, Filename=${body.filename}, Key=${body.key}`);


        if (!process.env.S3_ENDPOINT) {
            console.warn("Warning: S3_ENDPOINT is not defined. Multipart uploads may fail if not using standard AWS.");
        }

        if (!BUCKET_NAME) {
            return NextResponse.json({ error: "Server Configuration Error: Missing Bucket" }, { status: 500 });
        }

        // --- ACTION: CREATE (Init) ---
        if (action === "create") {
            const { filename, contentType } = body;
            if (!filename || !contentType) return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });

            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
            const key = `${Date.now()}-${sanitizedFilename}`;

            const command = new CreateMultipartUploadCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                ContentType: contentType
            });

            const response = await S3.send(command);
            return NextResponse.json({
                uploadId: response.UploadId,
                key: key
            });
        }

        // --- ACTION: SIGN PART ---
        if (action === "sign-part") {
            const { key, uploadId, partNumber } = body;
            if (!key || !uploadId || !partNumber) return NextResponse.json({ error: "Missing key, uploadId, or partNumber" }, { status: 400 });

            const command = new UploadPartCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber
            });

            // Sign URL for this specific part (valid for 1 hour)
            const signedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
            return NextResponse.json({ signedUrl });
        }

        // --- ACTION: COMPLETE ---
        if (action === "complete") {
            const { key, uploadId, parts } = body; // parts = [{ ETag, PartNumber }, ...]
            if (!key || !uploadId || !parts) return NextResponse.json({ error: "Missing key, uploadId, or parts" }, { status: 400 });

            // Sort parts by PartNumber just in case
            const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

            const command = new CompleteMultipartUploadCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: sortedParts
                }
            });

            const result = await S3.send(command);

            // Construct Public URL
            let publicUrl = "";
            const publicDomain = sanitizeEnv(process.env.S3_PUBLIC_DOMAIN);
            if (publicDomain) {
                publicUrl = `${publicDomain}/${key}`;
            } else {
                publicUrl = `${cleanEndpoint}/${BUCKET_NAME}/${key}`;
            }

            return NextResponse.json({
                location: result.Location,
                publicUrl: publicUrl
            });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error) {
        console.error("Multipart API Error:", error);
        const msg = (error instanceof Error) ? error.message : "Multipart Operation Failed";
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        );
    }
}
