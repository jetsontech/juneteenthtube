
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const KEEP_IDS = [
    '9d4580ca-7691-4bce-b79d-a3955d49e8cb', // DJI_20240623_182037_459_video
    'b38ae17e-6416-48d5-8d5c-3cedfe7484a5', // DJI_20250615_211427_150_video
    'ee99a856-9941-4ad6-8a87-099c71367a96', // Juneteenth Stage (Official High-Res MP4)
];

async function cleanupVideos() {
    console.log("Starting Cleanup...");
    console.log(`Preserving IDs: ${KEEP_IDS.join(', ')}`);

    // 1. Fetch all first to confirm
    const { data: allVideos, error: fetchError } = await supabase
        .from('videos')
        .select('id, title');

    if (fetchError) {
        console.error("Error fetching videos:", fetchError);
        return;
    }

    const toDelete = allVideos.filter(v => !KEEP_IDS.includes(v.id));

    if (toDelete.length === 0) {
        console.log("No videos to delete.");
        return;
    }

    console.log(`Found ${toDelete.length} videos to delete.`);
    toDelete.forEach(v => console.log(`- Deleting: [${v.id}] ${v.title}`));

    const idsToDelete = toDelete.map(v => v.id);

    // 2. Delete
    const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error("Error deleting videos:", deleteError);
    } else {
        console.log("Successfully deleted videos.");
    }
}

cleanupVideos();
