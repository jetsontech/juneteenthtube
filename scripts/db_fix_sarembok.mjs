import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://fybxhwpkujbodlfoadem.supabase.co",
    "sb_secret_x7vnGjnAZoh-fRhNKaORYg_SF7n_0kC"
);

async function run() {
    console.log('--- Updating SAREMBOK Channel ---');
    // First, make sure SAREMBOK is internal_vod and clear the stream_url
    const { data: updateRes, error: updateErr } = await supabase
        .from('channels')
        .update({
            is_internal_vod: true,
            stream_url: '' // Remove Big Buck Bunny!
        })
        .eq('name', 'SAREMBOK')
        .select();

    if (updateErr) console.error("Channel Update Error:", updateErr);
    console.log("Updated channel:", updateRes);

    if (!updateRes || updateRes.length === 0) return;
    const sarembokId = updateRes[0].id;

    console.log('\n--- Finding Jam Video ---');
    const { data: jamVideos } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', '%Jam%')
        .limit(1);

    if (!jamVideos || jamVideos.length === 0) {
        console.log("Jam video not found!");
        return;
    }
    const jamVideo = jamVideos[0];
    console.log("Found Jam:", jamVideo.id);

    console.log('\n--- Scheduling Jam Video ---');
    const now = new Date();
    const startTime = new Date(now.getTime() - (now.getTime() % 1000));
    const durationSeconds = 3600; // default 1 hour if unknown
    const endTime = new Date(startTime.getTime() + (durationSeconds * 1000));

    const { data: epgInsert, error: epgErr } = await supabase
        .from('epg_data')
        .insert({
            channel_id: sarembokId,
            video_id: jamVideo.id,
            title: jamVideo.title,
            description: "SAREMBOK Artist Upload",
            thumbnail_url: jamVideo.thumbnail_url,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString()
        })
        .select();

    if (epgErr) console.error("EPG Insert Error:", epgErr);
    console.log("Scheduled Jam:", epgInsert);
}

run();
