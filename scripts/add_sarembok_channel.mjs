import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log("Seeding SAREMBOK channel...");

    const channel = {
        name: "SAREMBOK",
        description: "Cutting-edge flagship entertainment",
        logo_url: "/sarembok_logo.png",
        stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Using a dummy HLS stream if no internal VOD exist yet
        status: "active",
        category: "Entertainment",
        order_index: (await supabase.from('channels').select('order_index').order('order_index', { ascending: false }).limit(1)).data?.[0]?.order_index + 1 || 10,
        is_internal_vod: true // Setup to use J-Tube VODs eventually
    };

    const { data: insertedChannels, error } = await supabase.from('channels').insert([channel]).select();
    if (error) {
        console.error("Error inserting SAREMBOK:", error);
        return;
    }

    console.log("Channel inserted:", insertedChannels);
}

seed();
