
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log("1. Testing connection to:", supabaseUrl);

    // Create dummy buffer
    const buffer = Buffer.from('Hello World Permissions Test 2');

    console.log("2. Attempting upload to 'videos' bucket...");
    const { data, error } = await supabase.storage
        .from('videos')
        .upload('test_permissions_2.txt', buffer, {
            contentType: 'text/plain',
            upsert: true
        });

    if (error) {
        console.error("❌ Upload Failed!");
        console.error("Error Message:", error.message);
        return;
    }

    console.log("✅ Upload Successful:", data.path);

    console.log("3. Testing DB Insert...");
    const { data: dbData, error: dbError } = await supabase
        .from('videos')
        .insert([
            {
                title: "Test Video",
                video_url: "https://example.com/video.mp4",
                thumbnail_url: "https://example.com/thumb.jpg"
            }
        ])
        .select()
        .single();

    if (dbError) {
        console.error("❌ DB Insert Failed:", dbError.message);
    } else {
        console.log("✅ DB Insert Successful:", dbData.id);
    }
}

testUpload();
