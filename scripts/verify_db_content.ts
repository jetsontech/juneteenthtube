
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listVideos() {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .limit(1);

    if (error) {
        console.error("ERROR:", JSON.stringify(error));
    } else {
        console.log("SUCCESS_DATA:", JSON.stringify(data));
    }
}

listVideos();
