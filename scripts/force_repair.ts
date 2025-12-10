import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Hardcoded because env var is acting up in sub-shells
const CORRECT_DOMAIN = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
const MP4_FILENAME = "1764986159879-upload_target.mp4"; // From previous log

async function forceRepair() {
    console.log("🔧 Forced Repair...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Construct the 100% correct URL
    const correctUrl = `${CORRECT_DOMAIN}/${MP4_FILENAME}`;
    console.log(`🎯 Target URL: ${correctUrl}`);

    // 2. Find the Original Video (The one the user is clicking)
    const { data: originalVideo } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', 'DJI%')
        .single();

    if (!originalVideo) {
        console.error("Could not find original video record.");
        return;
    }

    console.log(`📝 Updating Video: ${originalVideo.title} (${originalVideo.id})`);

    // 3. Patch it
    const { error } = await supabase
        .from('videos')
        .update({ video_url: correctUrl })
        .eq('id', originalVideo.id);

    if (error) console.error("Update failed:", error);
    else console.log("🎉 FIXED. The database now points to the correct R2 MP4 file.");
}

forceRepair();
