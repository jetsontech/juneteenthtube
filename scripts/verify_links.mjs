import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLinks() {
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, video_url, video_url_h264')
        .limit(10);

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log(`Checking ${videos.length} videos...`);

    for (const v of videos) {
        console.log(`\nVideo: ${v.title} (${v.id})`);

        const check = async (name, url) => {
            if (!url) {
                console.log(`  ${name}: [MISSING]`);
                return;
            }
            try {
                const res = await fetch(url, { method: 'HEAD' });
                console.log(`  ${name}: [${res.status}] ${url}`);
            } catch (err) {
                console.log(`  ${name}: [ERROR] ${err.message}`);
            }
        };

        await check("Original", v.video_url);

        let h264 = v.video_url_h264;
        if (h264 && !h264.startsWith('http')) {
            h264 = `https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/${h264}`;
        }
        await check("H264", h264);
    }
}

verifyLinks().catch(console.error);
