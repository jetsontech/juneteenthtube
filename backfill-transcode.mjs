// Backfill script: dispatches a GitHub Actions transcode job for every
// existing video that hasn't been transcoded to H.264 yet.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GITHUB_TOKEN = process.env.GITHUB_DISPATCH_TOKEN;
const REPO = 'jetsontech/juneteenthtube-gh-transcoder';
const DELAY_MS = 3000; // 3s between dispatches to avoid rate limits

async function main() {
    // Fetch all videos that are missing an H.264 transcode
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, video_url, video_url_h264, transcode_status')
        .or('video_url_h264.is.null,video_url_h264.eq.')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to query videos:', error);
        process.exit(1);
    }

    console.log(`Found ${videos.length} video(s) needing transcode.\n`);

    if (videos.length === 0) {
        console.log('All videos are already transcoded!');
        return;
    }

    let dispatched = 0;
    let failed = 0;

    for (const video of videos) {
        console.log(`[${dispatched + failed + 1}/${videos.length}] Dispatching: "${video.title}" (${video.id})`);

        try {
            const res = await fetch(
                `https://api.github.com/repos/${REPO}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    },
                    body: JSON.stringify({
                        event_type: 'transcode',
                        client_payload: { videoId: video.id },
                    }),
                }
            );

            if (res.status === 204) {
                console.log(`   ✅ Dispatched successfully`);
                dispatched++;

                // Mark as pending in DB
                await supabase
                    .from('videos')
                    .update({ transcode_status: 'pending' })
                    .eq('id', video.id);
            } else {
                const body = await res.text();
                console.error(`   ❌ Failed (HTTP ${res.status}): ${body}`);
                failed++;
            }
        } catch (err) {
            console.error(`   ❌ Error:`, err.message);
            failed++;
        }

        // Delay between dispatches
        if (dispatched + failed < videos.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log(`\n--- DONE ---`);
    console.log(`Dispatched: ${dispatched} | Failed: ${failed}`);
    console.log(`Check progress at: https://github.com/${REPO}/actions`);
}

main();
