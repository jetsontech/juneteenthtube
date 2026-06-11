import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CORRECT_DOMAIN = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";

async function repair() {
    console.log("🔧 Starting Repair...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Find the broken video
    // searching for videos created recently
    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    // Find the one with 'undefined' or matching the upload
    const brokenVideo = videos.find(v => v.video_url.includes("undefined") || v.title.includes("DJI"));

    if (!brokenVideo) {
        console.log("✅ No broken video found in the last 5 uploads.");
        return;
    }

    console.log(`⚠️  Found Suspect Video: ${brokenVideo.title}`);
    console.log(`❌ Current URL: ${brokenVideo.video_url}`);

    // 2. Fix the URL
    // Extract the key (everything after the last slash)
    const key = brokenVideo.video_url.split('/').pop();
    const newUrl = `${CORRECT_DOMAIN}/${key}`;

    console.log(`✅ New URL: ${newUrl}`);

    // 3. Update DB
    const { error: updateError } = await supabase
        .from('videos')
        .update({ video_url: newUrl })
        .eq('id', brokenVideo.id);

    if (updateError) {
        console.error("❌ Update Failed:", updateError.message);
    } else {
        console.log("🎉 Video Repaired Successfully!");
    }
}

repair();
