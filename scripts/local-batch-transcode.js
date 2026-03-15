/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync } = require('fs');
const { pipeline } = require('stream/promises');
const { join } = require('path');
// tmpdir removed
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

// Checks if the URL needs to be converted to HLS
function needsHLSTranscode(video) {
    // If no optimized URL exists, it definitely needs one
    if (!video.video_url_h264) return true;

    // If the optimized URL is not an HLS playlist, it should be upgraded
    if (!video.video_url_h264.includes('.m3u8')) return true;

    return false;
}

async function transcodeToHLS(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
        const playlistPath = join(outputDir, 'index.m3u8');
        console.log(`  Spawning FFmpeg for HLS...`);
        const ffmpeg = spawn(ffmpegPath, [
            '-i', inputPath,
            '-c:v', 'libx264',
            '-crf', '18',
            '-preset', 'veryfast',    // Faster for VOD processing
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'high',
            '-level', '4.2',
            '-g', '48',
            '-keyint_min', '48',
            '-sc_threshold', '0',
            '-c:a', 'aac',
            '-ac', '2',
            '-ar', '48000',
            '-b:a', '192k',
            '-f', 'hls',
            '-hls_time', '6',
            '-hls_playlist_type', 'vod',
            '-hls_segment_filename', join(outputDir, 'segment_%03d.ts'),
            playlistPath
        ], { stdio: 'inherit' });

        ffmpeg.on('close', (code) => {
            if (code === 0) resolve(playlistPath);
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

    // Identify all videos that lack the premium HLS "Live Page" experience
    const targetVideos = videos.filter(v => needsHLSTranscode(v));
    console.log(`Found ${targetVideos.length} videos to upgrade to HLS.`);

    const tempDir = join(__dirname, 'temp_transcode');
    if (!existsSync(tempDir)) mkdirSync(tempDir);

    for (const [index, video] of targetVideos.entries()) {
        console.log(`[${index + 1}/${targetVideos.length}] Processing ${video.title} (${video.id})...`);

        const urlParts = video.video_url.split('/');
        const sourceFileName = urlParts[urlParts.length - 1];
        const folderName = sourceFileName.replace(/\.[^.]+$/, '');

        const inputPath = join(tempDir, `${video.id}_input.mov`);
        const hlsOutputDir = join(tempDir, `${video.id}_hls`);

        if (!existsSync(hlsOutputDir)) mkdirSync(hlsOutputDir);

        try {
            // 1. Download
            if (video.video_url.startsWith('http')) {
                console.log(`  Downloading remote URL: ${video.video_url}...`);

                const fetchWithRetry = async (url, retries = 5, backoff = 2000) => {
                    for (let i = 0; i < retries; i++) {
                        try {
                            const response = await fetch(url);
                            if (response.ok) return response;
                            throw new Error(`Status ${response.status}: ${response.statusText}`);
                        } catch (err) {
                            if (i === retries - 1) throw err;
                            const wait = backoff * Math.pow(2, i);
                            console.warn(`    Download failed (${err.message}). Retrying in ${wait / 1000}s...`);
                            await new Promise(r => setTimeout(r, wait));
                        }
                    }
                };

                const response = await fetchWithRetry(video.video_url);
                const fileStream = createWriteStream(inputPath);
                await pipeline(response.body, fileStream);
            } else {
                console.log(`  Downloading S3 Key: ${sourceFileName}...`);
                const getCmd = new GetObjectCommand({ Bucket: bucketName, Key: sourceFileName });
                const s3Res = await s3.send(getCmd);
                await pipeline(s3Res.Body, createWriteStream(inputPath));
            }

            // 2. Transcode to HLS
            console.log(`  Transcoding to HLS...`);
            await transcodeToHLS(inputPath, hlsOutputDir);

            // 3. Upload all HLS files
            const hlsFiles = require('fs').readdirSync(hlsOutputDir);
            console.log(`  Uploading ${hlsFiles.length} HLS files to folder ${folderName}/...`);

            for (const file of hlsFiles) {
                const filePath = join(hlsOutputDir, file);
                const s3Key = `${folderName}/${file}`;
                const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';

                const putCmd = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: s3Key,
                    Body: createReadStream(filePath),
                    ContentType: contentType
                });
                await s3.send(putCmd);
            }

            const playlistUrl = publicDomain
                ? `${publicDomain}/${folderName}/index.m3u8`
                : `${endpoint}/${bucketName}/${folderName}/index.m3u8`;

            // 4. Update DB
            console.log(`  Updating DB with HLS playlist...`);
            await supabase.from('videos').update({
                video_url_h264: playlistUrl, // Overwriting the field for optimized source
                transcode_status: 'completed'
            }).eq('id', video.id);

            console.log(`  Done! HLS Playlist: ${playlistUrl}`);

        } catch (err) {
            console.error(`  Failed: ${err.message}`);
            await supabase.from('videos').update({
                transcode_status: 'failed'
            }).eq('id', video.id);
        } finally {
            // cleanup
            try {
                if (existsSync(inputPath)) unlinkSync(inputPath);
                if (existsSync(hlsOutputDir)) {
                    const fs = require('fs');
                    fs.readdirSync(hlsOutputDir).forEach(f => {
                        try { unlinkSync(join(hlsOutputDir, f)); } catch (e) { /* ignore */ }
                    });
                    try { fs.rmdirSync(hlsOutputDir); } catch (e) { /* ignore */ }
                }
            } catch (err) {
                console.warn(`  Cleanup warning: ${err.message}`);
            }
        }
    }
    console.log('All done.');
}

main().catch(console.error);
