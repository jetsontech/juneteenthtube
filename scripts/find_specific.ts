
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function find() {
    const titles = [
        'DJI_20250615_211427_150_video',
        'DJI_20240623_182037_459_video',
        'Juneteenth Stage (Official High-Res MP4)'
    ];

    const { data, error } = await supabase.from('videos').select('title').in('title', titles);
    console.log("Found:", data?.map(v => v.title));

    // If not found, let's look for candidates to rename
    if (!data || data.length < 3) {
        console.log("Some not found. Listing candidates for rename...");
        const { data: candidates } = await supabase.from('videos').select('id, title').or('title.ilike.%drone%,title.ilike.%speech%,title.ilike.%parade%').limit(5);
        console.log("Candidates:", candidates);
    }
}

find();
