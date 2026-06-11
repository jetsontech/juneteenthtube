
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkThumbs() {
    const { data } = await supabase.from('videos').select('title, thumbnail_url');
    console.log(JSON.stringify(data, null, 2));
}

checkThumbs();
