import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: nulls } = await supabase.from("videos").select("id, title, video_url, transcode_status").is("transcode_status", null);
    console.log("NULL:", nulls);

    const { data: failed } = await supabase.from("videos").select("id, title, video_url, transcode_status").eq("transcode_status", "failed");
    console.log("FAILED:", failed);
}
check();
