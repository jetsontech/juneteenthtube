
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
    // Admin client for secure updates - Init inside handler to avoid build-time env errors
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const body = await req.json();
        const { id, title, thumbnail_url, views, video_url, duration, owner_id } = body;


        if (!id) {
            return NextResponse.json({ error: 'Missing Video ID' }, { status: 400 });
        }

        interface VideoUpdates {
            title?: string;
            thumbnail_url?: string;
            views?: number | string;
            video_url?: string;
            duration?: string;
            owner_id?: string;
        }


        const updates: VideoUpdates = {};
        if (title !== undefined) updates.title = title;
        if (thumbnail_url !== undefined) {
            updates.thumbnail_url = thumbnail_url;
            console.log(`[API] Updating thumbnail for ${id} to ${thumbnail_url}`);
        }
        if (views !== undefined) updates.views = views;
        if (video_url !== undefined) {
            updates.video_url = video_url;
            console.log(`[API] Updating video_url for ${id} to ${video_url}`);
        }
        if (duration !== undefined) {
            updates.duration = duration;
            console.log(`[API] Updating duration for ${id} to ${duration}`);
        }
        if (owner_id !== undefined) updates.owner_id = owner_id;


        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: 'No updates provided' });
        }

        const { data, error } = await supabaseAdmin
            .from('videos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[API] Update Failed:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // ====================================================================
        // AUTOMATIC LIVE TV (EPG) SCHEDULING
        // When video transcodes successfully and we get a videoUrl,
        // automatically schedule it on the matching Live TV channel.
        // ====================================================================
        if (updates.video_url || updates.duration) {
            try {
                // Determine which channel to broadcast this on.
                // Priority: Use the video's category name (like SAREMBOK), fallback to J-Tube Originals
                const targetChannelName = data.category || 'J-Tube Originals';

                // 1. Get the channel ID
                const { data: channelData } = await supabaseAdmin
                    .from('channels')
                    .select('id, name')
                    .or(`name.eq.${targetChannelName},name.eq.J-Tube Originals`)
                    .order('name', { ascending: targetChannelName === 'J-Tube Originals' ? true : false }) // Rough sort to prefer the target, fallback second
                    .limit(1)
                    .single();

                if (channelData) {
                    const channelId = channelData.id;
                    const now = new Date();

                    // Parse duration or fallback to 30 mins
                    // Fallback handles format issues
                    let durationSeconds = 1800;
                    const mergedDuration = updates.duration || data.duration;
                    if (mergedDuration && typeof mergedDuration === 'string') {
                        // Assuming format like "00:05:30" or just seconds
                        if (mergedDuration.includes(':')) {
                            const parts = mergedDuration.split(':');
                            if (parts.length === 3) {
                                durationSeconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
                            } else if (parts.length === 2) {
                                durationSeconds = (+parts[0]) * 60 + (+parts[1]);
                            }
                        } else {
                            const parsed = parseInt(mergedDuration, 10);
                            if (!isNaN(parsed) && parsed > 0) durationSeconds = parsed;
                        }
                    } else if (typeof mergedDuration === 'number') {
                        durationSeconds = mergedDuration;
                    }

                    // 2. Find when to schedule it (either right now, or after the currently playing video)
                    // We look for any currently playing or future scheduled video.
                    const { data: latestEpg } = await supabaseAdmin
                        .from('epg_data')
                        .select('end_time')
                        .eq('channel_id', channelId)
                        .gte('end_time', now.toISOString())
                        .order('end_time', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    // If there's an active schedule, append it to the end of the current block
                    // Alternatively, we could inject it as NEXT video, but appending is safer to not corrupt the stream timeline
                    // We'll insert it directly after the VERY LATEST currently scheduled item
                    let startTime = now;
                    if (latestEpg && latestEpg.end_time) {
                        startTime = new Date(latestEpg.end_time);
                    }
                    // Round to nearest second for clean HLS boundaries
                    startTime = new Date(startTime.getTime() - (startTime.getTime() % 1000));

                    const endTime = new Date(startTime.getTime() + (durationSeconds * 1000));

                    console.log(`[EPG] Scheduling video ${id} on Live TV from ${startTime.toISOString()} to ${endTime.toISOString()}`);

                    await supabaseAdmin.from('epg_data').insert({
                        channel_id: channelId,
                        video_id: id,
                        title: updates.title || data.title,
                        description: "New User Upload Broadcast!",
                        thumbnail_url: updates.thumbnail_url || data.thumbnail_url,
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString()
                    });
                }
            } catch (epgError) {
                console.error('[EPG] Failed to schedule uploaded video to Live TV:', epgError);
                // Don't fail the overall update request if EPG scheduling fails
            }
        }

        return NextResponse.json({ success: true, video: data });

    } catch (error) {
        console.error('[API] Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
