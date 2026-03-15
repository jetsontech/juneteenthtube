import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sanitizeEnv = (val) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase configuration. Check .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideoUrls() {
    console.log("🔍 Fetching videos from database...");
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, video_url, video_url_h264');

    if (error) {
        console.error("❌ Error fetching videos:", error);
        return;
    }

    console.log(`Found ${videos.length} videos. Checking for corrupted URLs...`);

    let updatedCount = 0;

    for (const video of videos) {
        let needsUpdate = false;
        let newUrl = video.video_url;
        let newUrlH264 = video.video_url_h264;

        if (video.video_url && (video.video_url.includes('\r') || video.video_url.includes('\n'))) {
            newUrl = video.video_url.replace(/[\r\n]/g, '');
            needsUpdate = true;
        }

        if (video.video_url_h264 && (video.video_url_h264.includes('\r') || video.video_url_h264.includes('\n'))) {
            newUrlH264 = video.video_url_h264.replace(/[\r\n]/g, '');
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`🛠️ Fixing URLs for video ID: ${video.id}`);
            const { error: updateError } = await supabase
                .from('videos')
                .update({
                    video_url: newUrl,
                    video_url_h264: newUrlH264
                })
                .eq('id', video.id);

            if (updateError) {
                console.error(`❌ Failed to update video ${video.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ Done! Repaired ${updatedCount} videos.`);
}

fixVideoUrls().catch(console.error);
