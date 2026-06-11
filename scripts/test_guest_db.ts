import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use fetch to hit the NEXT.JS API? No, I can't easily hit localhost:3000/api from here without the server running.
// BUT I can verify the DB operations directly or simulated logic. 
// Actually, verifying the DB tables exist and we can insert into them with 'guest_id' is the real test of the MIGRATION.
// The API routes just wrap this.

async function testGuestEngagement() {
    console.log("Testing Guest Engagement DB capabilities...");

    // 1. Get a video ID
    const { data: videos } = await supabase.from('videos').select('id').limit(1);
    const videoId = videos?.[0]?.id;

    if (!videoId) {
        console.error("No videos found to test with.");
        return;
    }
    console.log(`Using Video ID: ${videoId}`);

    const guestId = "test-script-guest-" + Date.now();
    console.log(`Using Guest ID: ${guestId}`);

    // 2. Test Comment Insert
    console.log("2. Testing Comment Insert...");
    const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
            video_id: videoId,
            content: "Test Comment form Script",
            user_name: "Script Tester",
            guest_id: guestId
        })
        .select()
        .single();

    if (commentError) {
        console.error("FAILED to insert comment:", commentError);
    } else {
        console.log("SUCCESS: Comment inserted:", comment.id);
    }

    // 3. Test Like Toggle (Insert)
    console.log("3. Testing Like Insert...");
    const { data: like, error: likeError } = await supabase
        .from('likes')
        .insert({
            video_id: videoId,
            guest_id: guestId,
            type: 'like'
        })
        .select()
        .single();

    if (likeError) {
        console.error("FAILED to insert like:", likeError);
    } else {
        console.log("SUCCESS: Like inserted:", like.id);
    }

    // 4. Test Subscription
    console.log("4. Testing Subscription...");
    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert({
            channel_name: "Test Channel",
            guest_id: guestId
        })
        .select()
        .single();

    if (subError) {
        console.error("FAILED to insert subscription:", subError);
    } else {
        console.log("SUCCESS: Subscription inserted:", sub.id);
    }

    console.log("Cleaning up test data...");
    if (comment) await supabase.from('comments').delete().eq('id', comment.id);
    if (like) await supabase.from('likes').delete().eq('id', like.id);
    if (sub) await supabase.from('subscriptions').delete().eq('id', sub.id);
    console.log("Cleanup done.");
}

testGuestEngagement();
