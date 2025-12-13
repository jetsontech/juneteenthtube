
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Testing the Service Role Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    console.log("Testing Deletion with SERVICE Key...");

    // 1. Fetch a video to delete (be careful, maybe create one first?)
    // Let's create a dummy video first to be safe
    console.log("Creating dummy video...");
    const { data: insertData, error: insertError } = await supabase
        .from('videos')
        .insert([
            {
                title: "DELETEME_TEST",
                video_url: "http://example.com",
                category: "Test"
            }
        ])
        .select()
        .single();

    if (insertError) {
        console.error("FAILED to insert dummy video:", insertError);
        return;
    }

    const id = insertData.id;
    console.log(`Inserted dummy video: ${id}`);

    // 2. Try to Delete it
    console.log(`Attempting to delete video: ${id}`);
    const { error: deleteError, count } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error("FAILED to delete video:", deleteError);
    } else {
        console.log("Deletion call successful. Checking if it's actually gone...");

        // 3. Verify
        const { data: checkData, error: checkError } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id);

        if (checkData && checkData.length > 0) {
            console.error("CRITICAL: Video STILL EXISTS in DB after delete call!", checkData);
        } else {
            console.log("SUCCESS: Video is gone.");
        }
    }
}

testDelete();
