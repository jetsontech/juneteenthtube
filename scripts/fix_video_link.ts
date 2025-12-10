import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function fixVideo() {
    console.log("🔧 Fixing Video Link...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Get the working MP4 record
    const { data: mp4Video } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', '%(MP4)%')
        .single();

    // 2. Get the original DJI record
    const { data: originalVideo } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', 'DJI%')
        .single();

    if (!mp4Video || !originalVideo) {
        console.error("❌ Could not find both records. Aborting.");
        console.log("MP4:", mp4Video);
        console.log("Original:", originalVideo);
        return;
    }

    console.log(`✅ Found New URL: ${mp4Video.video_url}`);
    console.log(`🎯 Updating Original Video: ${originalVideo.id}`);

    // 3. Update Original with New URL
    const { error: updateError } = await supabase
        .from('videos')
        .update({
            video_url: mp4Video.video_url,
            title: originalVideo.title // Keep original title
        })
        .eq('id', originalVideo.id);

    if (updateError) {
        console.error("❌ Update Failed:", updateError);
        return;
    }

    // 4. Delete the duplicate MP4 record to avoid clutter
    const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', mp4Video.id);

    if (deleteError) {
        console.warn("⚠️ Warning: Could not delete duplicate record", deleteError);
    } else {
        console.log("🧹 Cleaned up temporary record.");
    }

    console.log("🎉 Video Fixed! The original link now plays the MP4.");
}

fixVideo();
