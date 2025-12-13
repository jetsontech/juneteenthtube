
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listVideos() {
    console.log("Fetching all videos from DB...");
    const { data, error } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching videos:", error);
    } else {
        console.log(`Found ${data.length} videos:`);
        data.forEach(v => {
            console.log(`- [${v.id}] "${v.title}" (Thumb: ${v.thumbnail_url ? 'Yes' : 'No'})`);
        });
    }
}

listVideos();
