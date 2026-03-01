import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateOriginalsLive() {
    console.log("Generating 'J-Tube Originals' Continuous Broadcast Schedule...");

    try {
        // 1. Ensure the channel exists
        let { data: channelData, error: channelError } = await supabase
            .from('channels')
            .select('*')
            .eq('name', 'J-Tube Originals')
            .single();

        let channelId;

        if (!channelData) {
            console.log("Creating new J-Tube Originals Channel...");
            const { data: newChannel, error: newError } = await supabase
                .from('channels')
                .insert({
                    name: "J-Tube Originals",
                    description: "24/7 Continuous broadcast of JuneteenthTube's finest original uploads.",
                    logo_url: "https://ui-avatars.com/api/?name=J+Tube&background=b91c1c&color=fff&size=128",
                    is_internal_vod: true, // Flag this to tell the frontend player to act differently
                    status: 'active',
                    order_index: 1 // Put it at the very top of the guide
                })
                .select()
                .single();

            if (newError) throw newError;
            channelId = newChannel.id;
        } else {
            console.log("Channel already exists. Proceeding to update schedule...");
            channelId = channelData.id;
        }

        // 2. Fetch all public processed videos from the platform
        const { data: videos, error: videosError } = await supabase
            .from('videos')
            .select('id, title, description, video_url, duration, thumbnail_url')
            .not('video_url', 'is', null);

        if (videosError) throw videosError;

        if (!videos || videos.length === 0) {
            console.log("No completed videos found to broadcast. Exiting.");
            return;
        }

        console.log(`Found ${videos.length} original videos to schedule...`);

        // 3. Clear the old future schedule for this channel to prevent overlaps
        const now = new Date();
        await supabase
            .from('epg_data')
            .delete()
            .eq('channel_id', channelId)
            .gte('end_time', now.toISOString());

        // 4. Generate the new schedule for the next 48 hours
        const schedule = [];
        let currentTime = new Date(now.getTime() - (now.getTime() % 1000)); // Round to nearest second
        const fortyEightHoursFromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000));
        let videoIndex = 0;

        while (currentTime < fortyEightHoursFromNow) {
            const currentVideo = videos[videoIndex];

            // Real duration mapping or fallback to 30 minutes
            // If the duration is a string like "00:05:22" we would need to parse it, 
            // but we'll fallback to 1800 if missing or unparseable for now.
            const durationSeconds = typeof currentVideo.duration === 'number'
                ? currentVideo.duration
                : 1800; // 30 mins fallback

            // EPG End time
            const endTime = new Date(currentTime.getTime() + (durationSeconds * 1000));

            schedule.push({
                channel_id: channelId,
                video_id: currentVideo.id,
                title: currentVideo.title,
                description: currentVideo.description || "JuneteenthTube Original Broadcast",
                thumbnail_url: currentVideo.thumbnail_url,
                start_time: currentTime.toISOString(),
                end_time: endTime.toISOString()
            });

            // Move the timeline pointer to the end of this video
            currentTime = endTime;

            // Loop back to the first video if we run out
            videoIndex = (videoIndex + 1) % videos.length;
        }

        // 5. Batch insert the new schedule
        const chunkSize = 100;
        let insertedCount = 0;

        for (let i = 0; i < schedule.length; i += chunkSize) {
            const chunk = schedule.slice(i, i + chunkSize);
            const { error: insertError } = await supabase.from('epg_data').insert(chunk);
            if (insertError) {
                console.error("Error inserting schedule chunk:", insertError);
            } else {
                insertedCount += chunk.length;
            }
        }

        console.log(`SUCCESS! Generated ${insertedCount} broadcast blocks of original content for the next 48 hours.`);

    } catch (error) {
        console.error("Failed to generate original broadcast schedule:", error);
    }
}

generateOriginalsLive();
