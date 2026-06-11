import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Hardcoded Correct R2 URL
const CORRECT_URL = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/1764986159879-upload_target.mp4";

async function freshInsert() {
    console.log("✨ Inserting FRESH Video Record...");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
        .from('videos')
        .insert([
            {
                title: "Juneteenth Stage (Official High-Res MP4)",
                video_url: CORRECT_URL,
                thumbnail_url: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                duration: "04:12" // Placeholder, looks better
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("❌ Insert Failed:", error.message);
    } else {
        console.log("✅ SUCCESS! Created New Video ID:", data.id);
        console.log("   URL:", data.video_url);
    }
}

freshInsert();
