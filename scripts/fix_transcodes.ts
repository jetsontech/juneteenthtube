import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTranscodes() {
    // Get all with null or failed transcode_status AND no h264 url
    const { data: vids } = await supabase
        .from("videos")
        .select("id, title, video_url, transcode_status")
        .is("video_url_h264", null)
        .not("video_url", "is", null);

    const targets = vids?.filter(
        (v) => v.transcode_status === null || v.transcode_status === "failed" || v.transcode_status === "pending"
    ) || [];

    console.log(`Found ${targets.length} videos to transcode.`);

    for (const v of targets) {
        if (!v.video_url) continue;
        const sourceKey = v.video_url.split("/").pop();
        console.log(`Triggering transcode for ${v.title} (${sourceKey}) ID: ${v.id}...`);

        try {
            const res = await fetch("http://127.0.0.1:3000/api/transcode", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceKey, videoId: v.id })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error(`Failed to transcode ${v.id}: ${res.status} ${text}`);
            } else {
                const result = await res.json();
                console.log(`Success for ${v.id}:`, result);
            }
        } catch (e) {
            console.error(`Error for ${v.id}:`, e);
        }
    }
}

runTranscodes();
