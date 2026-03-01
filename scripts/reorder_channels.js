const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIUM_NAMES = [
    "Black Cinema Classics",
    "Tyler Perry's BET",
    "Revolt TV",
    "Bounce XL",
    "Ebony TV",
    "Africanews"
];

async function reorderChannels() {
    console.log("Fetching channels...");
    const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, order_index, created_at')
        .order('order_index', { ascending: true });

    if (error) {
        console.error("Error fetching channels:", error);
        return;
    }

    // Separate premium vs others
    const premiumChannels = [];
    const otherChannels = [];

    for (const channel of channels) {
        if (PREMIUM_NAMES.includes(channel.name)) {
            premiumChannels.push(channel);
        } else {
            otherChannels.push(channel);
        }
    }

    console.log(`Found ${premiumChannels.length} premium channels and ${otherChannels.length} other channels.`);

    // We want premium first, then the rest.
    const reordered = [...premiumChannels, ...otherChannels];

    console.log("Updating order indices in database...");

    let successCount = 0;
    for (let i = 0; i < reordered.length; i++) {
        const channel = reordered[i];
        const newIndex = i + 1; // 1-based index

        // Only update if it actually changed
        if (channel.order_index !== newIndex) {
            const { error: updateError } = await supabase
                .from('channels')
                .update({ order_index: newIndex })
                .eq('id', channel.id);

            if (updateError) {
                console.error(`Failed to update ${channel.name}:`, updateError);
            } else {
                successCount++;
                console.log(`Updated [${channel.name}] -> position ${newIndex}`);
            }
        }
    }

    console.log(`Done! Switched positions for ${successCount} channels.`);
}

reorderChannels();
