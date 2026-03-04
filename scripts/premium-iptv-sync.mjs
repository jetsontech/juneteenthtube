/**
 * Premium IPTV Sync Script
 * 
 * Fetches premium FAST (Free Ad-supported Streaming TV) channels from the iptv-org API
 * and aligns them with working stream URLs, then imports them into JuneteenthTube's Supabase database.
 * 
 * Usage: node scripts/premium-iptv-sync.mjs
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// We want these premium categories
const TARGET_CATEGORIES = ['news', 'movies', 'entertainment', 'documentary', 'sports', 'music', 'comedy'];

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) return reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function sync() {
    console.log('🔄 Sourcing Premium IPTV Channels from iptv-org...\n');

    try {
        console.log('📡 Fetching channel metadata...');
        const channelsData = await fetchJson('https://iptv-org.github.io/api/channels.json');

        console.log('📡 Fetching active streams...');
        const streamsData = await fetchJson('https://iptv-org.github.io/api/streams.json');

        // Filter for US English channels in our target categories
        const premiumChannels = channelsData.filter(c => {
            if (c.country !== 'US') return false;
            if (c.languages && c.languages.length > 0 && !c.languages.includes('eng')) return false;

            // Check if it belongs to one of our premium categories
            if (!c.categories || c.categories.length === 0) return false;
            return c.categories.some(cat => TARGET_CATEGORIES.includes(cat.toLowerCase()));
        });

        console.log(`   Found ${premiumChannels.length} premium US English channels.`);

        // Map them to active streams
        let allChannels = [];
        let orderIndex = 100;

        for (const channel of premiumChannels) {
            // Find a working stream for this channel
            const activeStreams = streamsData.filter(s => s.channel === channel.id && s.status !== 'error' && s.status !== 'timeout');
            if (activeStreams.length === 0) continue; // Skip if no active stream

            // Take the first active stream
            const stream = activeStreams[0];

            // Map internal categories
            let internalCategory = 'Entertainment';
            const catString = channel.categories.join(' ').toLowerCase();
            if (catString.includes('news')) internalCategory = 'News';
            else if (catString.includes('movie')) internalCategory = 'Movies';
            else if (catString.includes('doc') || catString.includes('sci')) internalCategory = 'Education';
            else if (catString.includes('sport')) internalCategory = 'Sports';

            allChannels.push({
                name: `[Live] ${channel.name}`,
                description: channel.network || 'Live TV Stream',
                category: internalCategory,
                stream_url: stream.url,
                logo_url: channel.logo || null,
                status: 'active',
                order_index: orderIndex++,
                is_internal_vod: false
            });

            // Limit to a reasonable number to avoid overwhelming the UI
            if (allChannels.length >= 150) break;
        }

        if (allChannels.length === 0) {
            console.log('\n❌ No active streams found to sync.');
            return;
        }

        console.log(`\n🗑️  Cleaning up old external IPTV channels...`);
        const { error: delError } = await supabase
            .from('channels')
            .delete()
            .or('name.ilike.%[Live]%,name.ilike.%[Pluto]%,name.ilike.%[Samsung]%');

        if (delError) {
            console.error('❌ Error deleting old channels:', delError.message);
            return;
        }

        console.log(`📺 Inserting ${allChannels.length} premium channels into Supabase...`);

        const BATCH_SIZE = 100;
        let inserted = 0;

        for (let i = 0; i < allChannels.length; i += BATCH_SIZE) {
            const batch = allChannels.slice(i, i + BATCH_SIZE);
            const { error: insError } = await supabase.from('channels').insert(batch);

            if (insError) {
                console.error(`❌ Error inserting batch:`, insError.message);
            } else {
                inserted += batch.length;
                process.stdout.write(`\r   Progress: ${inserted} / ${allChannels.length}`);
            }
        }

        console.log('\n\n═══════════════════════════════════════');
        console.log('✅ Premium IPTV Sync Complete!');
        console.log('═══════════════════════════════════════');
        console.log(`Added ${inserted} live channels (capped at 150) in categories: News, Movies, Entertainment, Sports, Education`);
        console.log('Refresh your Live TV page or Expo TV App to watch them!');

    } catch (err) {
        console.error('❌ Error during sync:', err.message);
    }
}

sync();
