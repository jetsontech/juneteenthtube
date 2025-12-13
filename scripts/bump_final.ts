
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function bumpFinal() {
    const now = new Date();

    // 1. DJI_2025... (Newest -> Top Left)
    await supabase.from('videos')
        .update({ created_at: new Date(now.getTime() + 10000).toISOString() })
        .eq('title', 'DJI_20250615_211427_150_video');

    // 2. DJI_2024... (2nd)
    await supabase.from('videos')
        .update({ created_at: new Date(now.getTime() + 8000).toISOString() })
        .eq('title', 'DJI_20240623_182037_459_video');

    // 3. Juneteenth Stage (3rd)
    await supabase.from('videos')
        .update({ created_at: new Date(now.getTime() + 6000).toISOString() })
        .eq('title', 'Juneteenth Stage (Official High-Res MP4)');

    console.log("Specific videos bumped to top!");
}

bumpFinal();
