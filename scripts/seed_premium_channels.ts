import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from parent dir
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PREMIUM_CHANNELS = [
    {
        name: "Black Cinema Classics",
        description: "24/7 stream of classic Black movies and entertainment.",
        logo_url: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=200",
        stream_url: "https://plex.wurl.tv/Plex_BlackCinema_HD/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    },
    {
        name: "Tyler Perry's BET",
        description: "Premium entertainment, sitcoms, and movies produced by Tyler Perry.",
        logo_url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200", // Placeholder
        // A placeholder for BET or Tyler Perry content - using a reliable public stream for demo
        stream_url: "https://lnc-bet-pluto.tubi.video/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    },
    {
        name: "Revolt TV",
        description: "Unapologetically Hip Hop. Music, news, and culture.",
        logo_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200",
        stream_url: "https://revolt.amagi.tv/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    },
    {
        name: "Bounce XL",
        description: "Leading broadcast network targeting African American audiences.",
        logo_url: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=200",
        stream_url: "https://bounce-samsungus.amagi.tv/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    },
    {
        name: "Ebony TV",
        description: "Documentaries, series, and movies celebrating Black culture.",
        logo_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200",
        stream_url: "https://ebonytv-samsung.amagi.tv/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    },
    {
        name: "Africanews",
        description: "Pan-African news channel broadcasting from an African perspective.",
        logo_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200",
        stream_url: "https://africanews.amagi.tv/playlist.m3u8",
        status: "active",
        is_internal_vod: false,
    }
];

async function seedChannels() {
    console.log("Seeding Premium Channels...");
    try {
        // Find highest order index
        const { data: existingChannels, error: fetchError } = await supabase
            .from('channels')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;

        let startIdx = 100; // Put them at the end or use a safe starting number
        if (existingChannels && existingChannels.length > 0) {
            startIdx = (existingChannels[0].order_index || 0) + 10;
        }

        const channelsToInsert = PREMIUM_CHANNELS.map((channel, i) => ({
            ...channel,
            order_index: startIdx + i
        }));

        const { error: insertError } = await supabase
            .from('channels')
            .insert(channelsToInsert);

        if (insertError) {
            console.error("Failed to insert premium channels:", insertError.message);
        } else {
            console.log(`Successfully added ${PREMIUM_CHANNELS.length} premium channels.`);
            console.log("Channels added:");
            PREMIUM_CHANNELS.forEach(c => console.log(` - ${c.name}`));
        }

    } catch (e: any) {
        console.error("Error setting up channels:", e.message);
    }
}

seedChannels();
