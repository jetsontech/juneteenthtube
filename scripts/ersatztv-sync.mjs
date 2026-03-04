/**
 * ErsatzTV → JuneteenthTube Sync Script
 * 
 * Reads channels from ErsatzTV's IPTV endpoints and syncs them
 * into the Supabase `channels` table so they appear on the Live TV page.
 * 
 * ErsatzTV endpoints used:
 *   - /iptv/channels.m3u  → Channel list with stream URLs
 *   - /iptv/xmltv.xml     → EPG / program schedule data
 *   - /api/channels        → JSON channel metadata
 * 
 * Usage: node scripts/ersatztv-sync.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import http from 'http';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ErsatzTV base URL — change this if running on a different host/port
const ERSATZTV_URL = 'http://localhost:8409';

// MediaMTX base URL — this is the streaming server that converts ErsatzTV's
// MPEG-TS output into HLS/WebRTC. Channels are available at /etv-channel-{n}/index.m3u8
const MEDIAMTX_HLS_URL = 'http://localhost:8888';

/**
 * Fetch JSON from an HTTP endpoint
 */
function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Failed to parse JSON from ${url}: ${data.substring(0, 200)}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetch text content from an HTTP endpoint
 */
function fetchText(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Parse an M3U playlist into channel objects
 */
function parseM3U(m3uContent) {
    const lines = m3uContent.split('\n').map(l => l.trim()).filter(Boolean);
    const channels = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
            const info = lines[i];
            const streamUrl = lines[i + 1];

            // Extract channel name (last part after comma)
            const nameMatch = info.match(/,\s*(.+)$/);
            const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

            // Extract tvg-logo
            const logoMatch = info.match(/tvg-logo="([^"]+)"/);
            const logo = logoMatch ? logoMatch[1] : null;

            // Extract channel-number
            const numMatch = info.match(/channel-number="(\d+)"/);
            const channelNumber = numMatch ? parseInt(numMatch[1]) : 0;

            // Extract group-title (category)
            const groupMatch = info.match(/group-title="([^"]+)"/);
            const category = groupMatch ? groupMatch[1] : 'Entertainment';

            if (streamUrl && !streamUrl.startsWith('#')) {
                channels.push({
                    name: `[ETV] ${name}`,
                    description: `ErsatzTV Channel ${channelNumber} — Self-hosted linear broadcast`,
                    logo_url: logo,
                    stream_url: `${MEDIAMTX_HLS_URL}/etv-channel-${channelNumber}/index.m3u8`,
                    category: category,
                    order_index: channelNumber,
                    status: 'active',
                    is_internal_vod: false
                });
            }
        }
    }

    return channels;
}

/**
 * Parse XMLTV EPG data into program objects 
 */
function parseXMLTV(xmlContent, channelIdMap) {
    const programs = [];

    // Simple regex-based XML parsing for XMLTV programme elements
    const programRegex = /<programme start="([^"]+)" stop="([^"]+)" channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
    let match;

    while ((match = programRegex.exec(xmlContent)) !== null) {
        const [, start, stop, xmltvChannelId, innerContent] = match;

        // Parse XMLTV datetime format: 20260303210000 +0000
        const parseXMLTVDate = (str) => {
            const cleaned = str.replace(/\s+[+-]\d{4}$/, '');
            const year = cleaned.substring(0, 4);
            const month = cleaned.substring(4, 6);
            const day = cleaned.substring(6, 8);
            const hour = cleaned.substring(8, 10);
            const minute = cleaned.substring(10, 12);
            const second = cleaned.substring(12, 14);
            return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
        };

        // Extract title
        const titleMatch = innerContent.match(/<title[^>]*>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1] : 'Unknown Program';

        // Extract description
        const descMatch = innerContent.match(/<desc[^>]*>([^<]+)<\/desc>/);
        const description = descMatch ? descMatch[1] : '';

        // Map XMLTV channel ID to our Supabase channel UUID
        const supabaseChannelId = channelIdMap[xmltvChannelId];

        if (supabaseChannelId) {
            programs.push({
                channel_id: supabaseChannelId,
                title,
                description,
                start_time: parseXMLTVDate(start).toISOString(),
                end_time: parseXMLTVDate(stop).toISOString()
            });
        }
    }

    return programs;
}

async function syncErsatzTV() {
    console.log('🔄 Syncing ErsatzTV channels to JuneteenthTube...\n');

    try {
        // 1. Fetch ErsatzTV channel data
        console.log('📡 Fetching ErsatzTV M3U playlist...');
        const m3uContent = await fetchText(`${ERSATZTV_URL}/iptv/channels.m3u`);
        const etvChannels = parseM3U(m3uContent);
        console.log(`   Found ${etvChannels.length} ErsatzTV channel(s)\n`);

        if (etvChannels.length === 0) {
            console.log('⚠️  No channels found in ErsatzTV. Add media and create channels in the ErsatzTV UI first.');
            console.log(`   Open ${ERSATZTV_URL} in your browser to configure.`);
            return;
        }

        // 2. Remove old ErsatzTV channels from Supabase (identified by [ETV] prefix)
        console.log('🗑️  Removing old ErsatzTV channels from Supabase...');
        await supabase.from('channels').delete().like('name', '[ETV]%');

        // 3. Insert new ErsatzTV channels
        console.log('📺 Inserting ErsatzTV channels into Supabase...');
        const { data: insertedChannels, error: insertError } = await supabase
            .from('channels')
            .insert(etvChannels)
            .select('id, name');

        if (insertError) throw insertError;
        console.log(`   ✅ Inserted ${insertedChannels.length} channel(s)\n`);

        // 3. Fetch and sync EPG data
        console.log('📋 Fetching ErsatzTV XMLTV EPG data...');
        const xmltvContent = await fetchText(`${ERSATZTV_URL}/iptv/xmltv.xml`);

        // Build a mapping from XMLTV channel IDs to Supabase UUIDs
        // XMLTV uses IDs like "C1.145.ersatztv.org"
        const etvApiChannels = await fetchJSON(`${ERSATZTV_URL}/api/channels`);
        const channelIdMap = {};

        etvApiChannels.forEach((apiCh, idx) => {
            const xmltvId = `C${apiCh.number}.145.ersatztv.org`;
            if (insertedChannels[idx]) {
                channelIdMap[xmltvId] = insertedChannels[idx].id;
            }
        });

        const programs = parseXMLTV(xmltvContent, channelIdMap);

        if (programs.length > 0) {
            // Remove old EPG entries for these channels
            const channelIds = Object.values(channelIdMap);
            for (const cid of channelIds) {
                await supabase.from('epg_data').delete().eq('channel_id', cid);
            }

            // Insert new EPG data in batches
            const batchSize = 100;
            let inserted = 0;
            for (let i = 0; i < programs.length; i += batchSize) {
                const batch = programs.slice(i, i + batchSize);
                const { error } = await supabase.from('epg_data').insert(batch);
                if (!error) inserted += batch.length;
            }
            console.log(`   ✅ Synced ${inserted} EPG program entries\n`);
        } else {
            console.log('   ℹ️  No EPG program data found (this is normal for new channels)\n');
        }

        // 4. Summary
        console.log('═══════════════════════════════════════');
        console.log('✅ ErsatzTV sync complete!');
        console.log('═══════════════════════════════════════');
        console.log(`\nChannels synced:`);
        insertedChannels.forEach(ch => console.log(`  📺 ${ch.name}`));
        console.log(`\nStream URLs are pointing to: ${ERSATZTV_URL}`);
        console.log(`Refresh your Live TV page at http://localhost:3001/live to see them!\n`);

    } catch (error) {
        console.error('❌ Sync failed:', error);
    }
}

syncErsatzTV();
