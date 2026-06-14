import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getDisplayViews } from '@/lib/viewHelpers';
import fs from 'fs';
import path from 'path';

// export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds to prevent DB exhaustion
interface DBVideo {
    id: string;
    title: string;
    thumbnail_url?: string;
    views?: number;
    created_at: string;
    duration?: string;
    video_url: string;
    category?: string;
    state?: string;
    channel_name?: string;
    channel_avatar?: string;
    video_url_h264?: string;
    transcode_status?: string | null;
    owner_id?: string;
    is_featured?: boolean;
    is_trending?: boolean;
    featured_title?: string;
    featured_category?: string;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const category = searchParams.get('category');
        const state = searchParams.get('state');
        const feed = searchParams.get('feed') || 'recent';

        let query = supabaseAdmin
            .from('videos')
            .select('*', { count: 'exact' });

        // Apply state-driven filtering only for non-featured feeds (Featured Hero Carousel is a global showcase)
        if (state && state !== 'GLOBAL' && feed !== 'featured') {
            query = query.or(`state.eq.${state},state.eq.GLOBAL`);
        }

        if (category && category !== 'All' && category !== 'null') {
            query = query.eq('category', category);
        }

        // Hide non-user uploaded videos (owner_id is null) from everything EXCEPT the Legacy Vault
        if (category !== 'Vault') {
            query = query.not('owner_id', 'is', null);
        }

        if (feed === 'trending') {
            let pauseOrganic = false;
            try {
                const { data } = await supabaseAdmin
                    .from('platform_settings')
                    .select('algorithm_paused')
                    .eq('id', 'global')
                    .single();
                if (data && data.algorithm_paused) {
                    pauseOrganic = true;
                }
            } catch (e) {
                console.error("Failed to fetch platform settings:", e);
            }

            if (pauseOrganic) {
                // Show only curated/promoted trending videos if organic trending is paused
                query = query.eq('is_trending', true).order('created_at', { ascending: false });
            } else {
                query = query.order('views', { ascending: false });
            }
        } else if (feed === 'featured') {
            query = query.eq('is_featured', true).order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, count, error } = await query
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const mappedVideos = ((data as unknown as DBVideo[]) || []).map((video: DBVideo) => {
            const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
            
            let h264Url = video.video_url_h264;
            if (h264Url && !h264Url.startsWith('http')) {
                h264Url = `${s3Domain}/${h264Url}`;
            }

            let videoUrl = video.video_url;
            if (videoUrl && !videoUrl.startsWith('http')) {
                if (videoUrl.startsWith('pub-efcc4aa0b3b24e3d97760577b0ec20bd/')) {
                    videoUrl = `${s3Domain}/${videoUrl.substring('pub-efcc4aa0b3b24e3d97760577b0ec20bd/'.length)}`;
                } else {
                    videoUrl = `${s3Domain}/${videoUrl}`;
                }
            }

            let thumbnail = video.thumbnail_url || "";
            if (thumbnail) {
                if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                    thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
                }
                if (thumbnail.includes('media.culturequest.vip')) {
                    thumbnail = thumbnail.replace('media.culturequest.vip', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                }
            }

            return {
                id: video.id,
                title: video.title,
                thumbnail: thumbnail,
                channelName: video.channel_name || (video.category === 'Food' ? 'ATL Foodie' : 'CultureQuestTV'),
                channelAvatar: video.channel_avatar || "",
                views: getDisplayViews(video.id, Number(video.views) || 0).toString(),
                postedAt: video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently",
                duration: video.duration || "5:00",
                videoUrl: videoUrl,
                category: video.category || "All",
                createdAt: video.created_at,
                state: video.state || "GLOBAL",
                videoUrlH264: h264Url,
                transcodeStatus: video.transcode_status,
                ownerId: video.owner_id,
                isFeatured: video.is_featured || false,
                isTrending: video.is_trending || false,
                featuredTitle: video.featured_title || "",
                featuredCategory: video.featured_category || ""
            };
        });

        return NextResponse.json({ videos: mappedVideos, total: count || 0 });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
