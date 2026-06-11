import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const VIDEO_ID = "f1bbbd2b-9a9a-4710-9fde-3d59634a94d3";
const CORRECT_URL = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/1764986159879-upload_target.mp4";

async function superFix() {
    console.log(`🔨 Targeting Video ID: ${VIDEO_ID}`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Verify it exists
    const { data: before } = await supabase.from('videos').select('video_url').eq('id', VIDEO_ID).single();
    console.log("Before:", before?.video_url);

    // 2. Smash the new URL in
    const { data, error } = await supabase
        .from('videos')
        .update({ video_url: CORRECT_URL })
        .eq('id', VIDEO_ID)
        .select()
        .single();

    if (error) {
        console.error("❌ FAILURE:", error);
    } else {
        console.log("✅ SUCCESS. New Record:");
        console.log(data);
    }
}

superFix();
