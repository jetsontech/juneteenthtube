
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function TEST_API_UPDATE() {
    // 1. Get a video ID
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: videos } = await supabase.from('videos').select('id, title').limit(1);

    if (!videos || videos.length === 0) {
        console.error("No videos found to test with.");
        return;
    }
    const targetVideo = videos[0];
    console.log(`Testing update on: ${targetVideo.title} (${targetVideo.id})`);

    // 2. Call the API (Simulating a fetch from backend script context might need base URL)
    // Actually, since we are in a script, we can't easily "fetch" localhost:3000/api if the server isn't running or if we don't have absolute URL
    // BUT, we can just run the logic that the API does to prove permission works? 
    // No, we want to test the API route itself.

    // Instead, let's assume the user will test via UI, OR we can try to curl it if server is running.
    // Let's just create a script that USES THE SERVICE ROLE KEY to update, to prove that AT LEAST the key works.

    const newThumb = `https://example.com/test_thumb_${Date.now()}.jpg`;
    console.log(`Setting thumb to: ${newThumb}`);

    const { error } = await supabase
        .from('videos')
        .update({ thumbnail_url: newThumb })
        .eq('id', targetVideo.id);

    if (error) {
        console.error("Service Role Update Failed:", error);
    } else {
        console.log("Service Role Update SUCCESS!");

        // Verify
        const { data } = await supabase.from('videos').select('thumbnail_url').eq('id', targetVideo.id).single();
        console.log("New Value in DB:", data?.thumbnail_url);
    }
}

TEST_API_UPDATE();
