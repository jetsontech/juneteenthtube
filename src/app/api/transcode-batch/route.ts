import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper: Check if URL is likely HEVC
function isLikelyHEVC(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.mov') ||
        lowerUrl.endsWith('.hevc') ||
        lowerUrl.includes('quicktime');
}

// POST: Trigger batch transcoding for all existing HEVC videos
export async function POST() {
    try {
        // 1. Fetch all videos that need transcoding
        //    - Have a video URL that looks like HEVC
        //    - Don't already have an H.264 version
        //    - transcode_status is null or 'failed' (retry failed ones)
        const { data: videos, error: fetchError } = await supabase
            .from('videos')
            .select('id, video_url, transcode_status')
            .is('video_url_h264', null)
            .not('video_url', 'is', null);

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!videos || videos.length === 0) {
            return NextResponse.json({
                message: 'No videos need transcoding',
                processed: 0
            });
        }

        // 2. Filter to only HEVC videos
        const hevcVideos = videos.filter(v => isLikelyHEVC(v.video_url));

        if (hevcVideos.length === 0) {
            return NextResponse.json({
                message: 'No HEVC videos found',
                total: videos.length,
                hevc: 0
            });
        }

        // 3. Mark all as 'pending' first
        const videoIds = hevcVideos.map(v => v.id);
        await supabase
            .from('videos')
            .update({ transcode_status: 'pending' })
            .in('id', videoIds);

        // 4. Trigger transcoding sequentially (to avoid resource limits)
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const results = [];
        let completed = 0;
        let failed = 0;

        // Limit to first 5 per batch run to allow incremental processing without timeout
        const batchSize = 5;
        const processingBatch = hevcVideos.slice(0, batchSize);

        for (const video of processingBatch) {
            // Extract R2 key from publicUrl
            const urlParts = video.video_url.split('/');
            const sourceKey = urlParts[urlParts.length - 1];

            try {
                const response = await fetch(`${baseUrl}/api/transcode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sourceKey: sourceKey,
                        videoId: video.id
                    })
                });

                if (response.ok) {
                    const { h264Url } = await response.json();
                    // Update DB with H.264 URL
                    await supabase.from('videos').update({
                        video_url_h264: h264Url,
                        transcode_status: 'completed'
                    }).eq('id', video.id);
                    results.push({ id: video.id, status: 'completed', h264Url });
                    completed++;
                } else {
                    const errorText = await response.text();
                    await supabase.from('videos').update({
                        transcode_status: 'failed'
                    }).eq('id', video.id);
                    results.push({ id: video.id, status: 'failed', error: errorText });
                    failed++;
                }
            } catch (err) {
                await supabase.from('videos').update({
                    transcode_status: 'failed'
                }).eq('id', video.id);
                results.push({ id: video.id, status: 'error', error: String(err) });
                failed++;
            }
        }

        return NextResponse.json({
            message: `Batch run complete (processed ${processingBatch.length} of ${hevcVideos.length} pending)`,
            remaining: hevcVideos.length - processingBatch.length,
            total: videos.length,
            hevcFound: hevcVideos.length,
            completed,
            failed,
            results
        });

    } catch (error) {
        console.error('Batch transcode error:', error);
        return NextResponse.json({
            error: 'Batch transcoding failed',
            details: String(error)
        }, { status: 500 });
    }
}

// GET: Check status of all videos needing transcoding
export async function GET() {
    try {
        const { data: videos, error } = await supabase
            .from('videos')
            .select('id, title, video_url, video_url_h264, transcode_status')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const stats = {
            total: videos?.length || 0,
            hevc: videos?.filter(v => isLikelyHEVC(v.video_url)).length || 0,
            transcoded: videos?.filter(v => v.video_url_h264).length || 0,
            pending: videos?.filter(v => v.transcode_status === 'pending').length || 0,
            failed: videos?.filter(v => v.transcode_status === 'failed').length || 0,
        };

        return NextResponse.json({
            stats,
            videos: videos?.map(v => ({
                id: v.id,
                title: v.title,
                isHEVC: isLikelyHEVC(v.video_url),
                hasH264: !!v.video_url_h264,
                status: v.transcode_status
            }))
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
