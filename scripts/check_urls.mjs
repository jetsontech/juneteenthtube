import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sanitizeEnv = (val) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrls() {
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, video_url')
        .limit(5);

    if (error) {
        console.error(error);
        return;
    }

    for (const v of videos) {
        console.log(`ID: ${v.id}`);
        console.log(`URL: |${v.video_url}|`);
        console.log(`Encoded: ${JSON.stringify(v.video_url)}`);
    }
}

checkUrls().catch(console.error);
