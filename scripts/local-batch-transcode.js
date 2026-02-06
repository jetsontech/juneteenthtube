require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync } = require('fs');
const { pipeline } = require('stream/promises');
const { join } = require('path');
const { tmpdir } = require('os');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.S3_BUCKET_NAME;
const region = process.env.S3_REGION === 'auto' ? 'us-east-1' : process.env.S3_REGION;
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const publicDomain = process.env.S3_PUBLIC_DOMAIN;

if (!supabaseUrl || !supabaseKey || !bucketName || !endpoint) {
    console.error('Missing configuration in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED"
});

function isLikelyHEVC(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mov') || lower.endsWith('.hevc') || lower.includes('quicktime');
}

async function transcodeFile(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`Spawn ffmpeg: ${ffmpegPath}`);
        const ffmpeg = spawn(ffmpegPath, [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-crf', '23',
            '-preset', 'fast', // fast is fine locally
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            outputPath
        ]);

        // ffmpeg.stderr.pipe(process.stdout); // Verbose logging

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });

        ffmpeg.on('error', reject);
    });
}

async function main() {
    console.log('Fetching videos needing transcoding...');
    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .is('video_url_h264', null)
        .not('video_url', 'is', null);

    if (error) throw error;

    // Filter HEVC
    const hevcVideos = videos.filter(v => isLikelyHEVC(v.video_url));
    console.log(`Found ${hevcVideos.length} HEVC videos to transcode.`);

    const tempDir = join(__dirname, 'temp_transcode');
    if (!existsSync(tempDir)) mkdirSync(tempDir);

    for (const [index, video] of hevcVideos.entries()) {
        console.log(`[${index + 1}/${hevcVideos.length}] Processing ${video.title} (${video.id})...`);

        const urlParts = video.video_url.split('/');
        const sourceKey = urlParts[urlParts.length - 1];
        const inputPath = join(tempDir, `${video.id}_input.mov`);
        const outputPath = join(tempDir, `${video.id}_output.mp4`);
        const h264Key = sourceKey.replace(/\.[^.]+$/, '_h264.mp4');

        try {
            // 1. Download
            console.log(`  Downloading ${sourceKey}...`);
            const getCmd = new GetObjectCommand({ Bucket: bucketName, Key: sourceKey });
            const s3Res = await s3.send(getCmd);
            await pipeline(s3Res.Body, createWriteStream(inputPath));

            // 2. Transcode
            console.log(`  Transcoding to H.264...`);
            await transcodeFile(inputPath, outputPath);

            // 3. Upload
            console.log(`  Uploading dest ${h264Key}...`);
            const fileStream = createReadStream(outputPath);
            // Must calculate size or let sdk handle content-length? Stream upload works.
            const putCmd = new PutObjectCommand({
                Bucket: bucketName,
                Key: h264Key,
                Body: fileStream,
                ContentType: 'video/mp4'
            });
            await s3.send(putCmd);

            const publicUrl = publicDomain
                ? `${publicDomain}/${h264Key}`
                : `${endpoint}/${bucketName}/${h264Key}`;

            // 4. Update DB
            console.log(`  Updating DB...`);
            await supabase.from('videos').update({
                video_url_h264: publicUrl,
                transcode_status: 'completed'
            }).eq('id', video.id);

            console.log(`  Done! URL: ${publicUrl}`);

        } catch (err) {
            console.error(`  Failed: ${err.message}`);
            await supabase.from('videos').update({
                transcode_status: 'failed'
            }).eq('id', video.id);
        } finally {
            // cleanup
            if (existsSync(inputPath)) unlinkSync(inputPath);
            if (existsSync(outputPath)) unlinkSync(outputPath);
        }
    }
    console.log('All done.');
}

main().catch(console.error);
