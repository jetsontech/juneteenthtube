import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchAndIngest() {
    console.log("Fetching channels from iptv-org...");

    try {
        const streamsRes = await fetch("https://iptv-org.github.io/api/streams.json");
        const streamsData = await streamsRes.json();

        const channelsRes = await fetch("https://iptv-org.github.io/api/channels.json");
        const channelsData = await channelsRes.json();

        console.log(`Fetched ${streamsData.length} streams and ${channelsData.length} channels.`);

        const activeStreams = new Map();
        for (const s of streamsData) {
            // As long as there's a channel ID and a URL, we will take it
            if (s.channel && s.url) {
                activeStreams.set(s.channel, s.url);
            }
        }

        const targetCategories = new Set(['movies', 'documentary', 'news', 'music', 'lifestyle', 'culture', 'classic', 'entertainment', 'comedy', 'sports']);
        const targetCountries = new Set(['US', 'UK', 'CA']);
        const targetLanguages = new Set(['eng']);

        const selectedChannels = [];
        let orderIndex = 3;

        for (const channel of channelsData) {
            const streamUrl = activeStreams.get(channel.id);
            if (!streamUrl) continue;

            const categories = channel.categories || [];
            const country = channel.country || "";
            const languages = channel.languages || [];
            const name = channel.name.toLowerCase();

            const isTargetCountry = targetCountries.has(country);
            const isTargetCategory = categories.some(c => targetCategories.has(c));
            const isEnglish = languages.includes('eng') || languages.length === 0; // Default to assuming english if blank but US based

            // Look for premium networks similar to Pluto TV's lineup (News, Movies, Pop Culture)
            const hasPremiumKeyword = name.includes('cbs') ||
                name.includes('abc') ||
                name.includes('nbc') ||
                name.includes('fox') ||
                name.includes('bloomberg') ||
                name.includes('movie') ||
                name.includes('comedy') ||
                name.includes('bet') ||
                name.includes('black') ||
                name.includes('africa') ||
                name.includes('vevo') ||
                name.includes('music') ||
                name.includes('news');

            // Must be english speaking AND either (from a target country + category) OR (has a premium recognized keyword)
            if (isEnglish && ((isTargetCountry && isTargetCategory) || (isTargetCountry && hasPremiumKeyword))) {
                if (channel.is_nsfw) continue;

                selectedChannels.push({
                    name: channel.name,
                    description: (categories.length > 0 ? categories.join(", ") : "Premium Content") + " broadcasting 24/7",
                    logo_url: channel.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=111&color=fff&size=128`,
                    stream_url: streamUrl,
                    status: 'active',
                    order_index: orderIndex++
                });
            }

            // Limit to about 120 premium channels to avoid crushing the UI list
            if (selectedChannels.length >= 120) break;
        }

        console.log(`Filtered down to ${selectedChannels.length} highly relevant channels! Inserting into Supabase...`);

        if (selectedChannels.length === 0) {
            console.log("No channels found! Check filtering logic.");
            return;
        }

        const chunkSize = 50;
        let insertedChannels = [];
        for (let i = 0; i < selectedChannels.length; i += chunkSize) {
            const chunk = selectedChannels.slice(i, i + chunkSize);
            const { data, error } = await supabase.from('channels').insert(chunk).select();
            if (error) {
                console.error("Error inserting channels chunk:", error);
                throw error;
            }
            if (data) insertedChannels = insertedChannels.concat(data);
            console.log(`Inserted chunk ${i / chunkSize + 1}...`);
        }

        console.log("Successfully inserted channels. Generating EPG timelines...");

        const now = new Date();
        const oneHour = 60 * 60 * 1000;
        const epgData = [];

        insertedChannels.forEach(channel => {
            for (let i = 0; i < 12; i++) {
                const startTime = new Date(now.getTime() - (now.getTime() % oneHour) + (i * oneHour));
                const endTime = new Date(startTime.getTime() + oneHour);

                epgData.push({
                    channel_id: channel.id,
                    title: `${channel.name} Live Broadcast`,
                    description: `Live continuous feed from ${channel.name}`,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString()
                });
            }
        });

        const epgChunkSize = 100;
        for (let i = 0; i < epgData.length; i += epgChunkSize) {
            const chunk = epgData.slice(i, i + epgChunkSize);
            const { error } = await supabase.from('epg_data').insert(chunk);
            if (error) {
                console.error("Error inserting EPG chunk:", error);
            }
        }

        console.log(`SUCCESS! Inserted ${insertedChannels.length} channels and ${epgData.length} timeline events!`);

    } catch (error) {
        console.error("Failed to ingest IPTV channels:", error);
    }
}

fetchAndIngest();
