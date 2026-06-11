import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log("Seeding channels...");

    // Clear existing
    await supabase.from('epg_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('channels').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new channels
    const channels = [
        {
            name: "Black Cinema Classics",
            description: "24/7 continuous broadcast of classic Black cinema",
            logo_url: "https://ui-avatars.com/api/?name=Black+Cinema&background=111&color=fff&size=128",
            stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            status: "active",
            order_index: 1
        },
        {
            name: "News Station",
            description: "Live 24/7 news coverage",
            logo_url: "https://ui-avatars.com/api/?name=News&background=2563eb&color=fff&size=128",
            stream_url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
            status: "active",
            order_index: 2
        }
    ];

    const { data: insertedChannels, error } = await supabase.from('channels').insert(channels).select();
    if (error) {
        console.error("Error inserting channels:", error);
        return;
    }

    console.log("Channels inserted:", insertedChannels);

    // Insert EPG data (programs)
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    const epgData = [];

    insertedChannels.forEach(channel => {
        // Create 24 hours of programming
        for (let i = 0; i < 24; i++) {
            const startTime = new Date(now.getTime() - (now.getTime() % oneHour) + (i * oneHour));
            const endTime = new Date(startTime.getTime() + oneHour);

            epgData.push({
                channel_id: channel.id,
                title: `${channel.name} Block ${i + 1}`,
                description: `Continuous broadcast on ${channel.name}`,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            });
        }
    });

    const { error: epgError } = await supabase.from('epg_data').insert(epgData);
    if (epgError) {
        console.error("Error inserting EPG:", epgError);
    } else {
        console.log(`Inserted ${epgData.length} EPG segments successfully!`);
    }
}

seed();
