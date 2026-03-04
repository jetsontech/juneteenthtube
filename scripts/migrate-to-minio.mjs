/**
 * R2-to-MinIO Migration Script
 * 
 * Copies all video assets from Cloudflare R2 to a local MinIO instance.
 * Uses the existing S3 SDK (@aws-sdk) that's already in the project.
 * 
 * Usage: node scripts/migrate-to-minio.mjs
 * 
 * Prerequisites:
 *   - MinIO running at http://localhost:9000
 *   - Bucket 'juneteenthtube-videos' created with public read policy
 *   - .env.local still has the original R2 credentials
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

// Source: Cloudflare R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
});

// Destination: Local MinIO  
const minioClient = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9000',
    credentials: {
        accessKeyId: 'juneteenthtube',
        secretAccessKey: 'juneteenthtube-admin-2026'
    },
    forcePathStyle: true // Required for MinIO
});

const R2_BUCKET = 'juneteenthtube';
const MINIO_BUCKET = 'juneteenthtube-videos';
const MINIO_PUBLIC_URL = 'http://localhost:9000';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function migrate() {
    console.log('🔄 Starting R2 → MinIO Migration\n');
    console.log(`Source:      R2 bucket "${R2_BUCKET}"`);
    console.log(`Destination: MinIO bucket "${MINIO_BUCKET}" at ${MINIO_PUBLIC_URL}\n`);

    let continuationToken = undefined;
    let totalObjects = 0;
    let totalBytes = 0;
    let migrated = 0;
    let failed = 0;

    try {
        // List all objects in R2
        do {
            const listCommand = new ListObjectsV2Command({
                Bucket: R2_BUCKET,
                ContinuationToken: continuationToken,
                MaxKeys: 100
            });

            const listResult = await r2Client.send(listCommand);
            const objects = listResult.Contents || [];
            totalObjects += objects.length;

            console.log(`📋 Found ${objects.length} objects in this batch (total so far: ${totalObjects})`);

            for (const obj of objects) {
                try {
                    process.stdout.write(`  📦 Copying: ${obj.Key} (${(obj.Size / 1024 / 1024).toFixed(1)} MB)... `);

                    // Download from R2
                    const getCommand = new GetObjectCommand({
                        Bucket: R2_BUCKET,
                        Key: obj.Key
                    });
                    const getResult = await r2Client.send(getCommand);
                    const body = await streamToBuffer(getResult.Body);

                    // Upload to MinIO
                    const putCommand = new PutObjectCommand({
                        Bucket: MINIO_BUCKET,
                        Key: obj.Key,
                        Body: body,
                        ContentType: getResult.ContentType || 'application/octet-stream'
                    });
                    await minioClient.send(putCommand);

                    totalBytes += obj.Size;
                    migrated++;
                    console.log('✅');
                } catch (err) {
                    failed++;
                    console.log(`❌ ${err.message}`);
                }
            }

            continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
        } while (continuationToken);

        // Update video URLs in Supabase to point to MinIO
        console.log('\n📝 Updating video URLs in Supabase...');
        const { data: videos, error } = await supabase
            .from('videos')
            .select('id, video_url, video_url_h264, thumbnail_url');

        if (!error && videos) {
            const R2_PUBLIC_URL = 'https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev';
            let updated = 0;

            for (const video of videos) {
                const updates = {};

                if (video.video_url && video.video_url.includes(R2_PUBLIC_URL)) {
                    updates.video_url = video.video_url.replace(R2_PUBLIC_URL, `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}`);
                }
                if (video.video_url_h264 && video.video_url_h264.includes(R2_PUBLIC_URL)) {
                    updates.video_url_h264 = video.video_url_h264.replace(R2_PUBLIC_URL, `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}`);
                }
                if (video.thumbnail_url && video.thumbnail_url.includes(R2_PUBLIC_URL)) {
                    updates.thumbnail_url = video.thumbnail_url.replace(R2_PUBLIC_URL, `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}`);
                }

                if (Object.keys(updates).length > 0) {
                    await supabase.from('videos').update(updates).eq('id', video.id);
                    updated++;
                }
            }
            console.log(`   Updated ${updated} video URLs to point to MinIO`);
        }

        // Summary
        console.log('\n═══════════════════════════════════════');
        console.log('✅ Migration Complete!');
        console.log('═══════════════════════════════════════');
        console.log(`  Objects migrated: ${migrated}`);
        console.log(`  Objects failed:   ${failed}`);
        console.log(`  Total data:       ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
        console.log(`\n  MinIO Console: http://localhost:9001`);
        console.log(`  User: juneteenthtube`);
        console.log(`  Pass: juneteenthtube-admin-2026`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
    }
}

migrate();
