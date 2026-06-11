
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
        const { id, title, thumbnail_url, views, video_url, duration, owner_id, is_featured, is_trending, featured_title, featured_category, increment_views } = body;

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
            is_featured?: boolean;
            is_trending?: boolean;
            featured_title?: string;
            featured_category?: string;
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
        if (is_featured !== undefined) {
            updates.is_featured = is_featured;
            console.log(`[API] Updating is_featured for ${id} to ${is_featured}`);
        }
        if (is_trending !== undefined) {
            updates.is_trending = is_trending;
            console.log(`[API] Updating is_trending for ${id} to ${is_trending}`);
        }
        if (featured_title !== undefined) {
            updates.featured_title = featured_title;
            console.log(`[API] Updating featured_title for ${id} to ${featured_title}`);
        }
        if (featured_category !== undefined) {
            updates.featured_category = featured_category;
            console.log(`[API] Updating featured_category for ${id} to ${featured_category}`);
        }

        if (increment_views === true) {
            // Fetch current views using supabaseAdmin (bypassing RLS)
            const { data: videoData, error: fetchError } = await supabaseAdmin
                .from('videos')
                .select('views')
                .eq('id', id)
                .maybeSingle();

            if (fetchError || !videoData) {
                return NextResponse.json({ error: 'Video not found or fetch failed' }, { status: 404 });
            }
            updates.views = (Number(videoData.views) || 0) + 1;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: 'No updates provided' });
        }

        const isViewsIncrementOnly = increment_views === true || (Object.keys(updates).length === 1 && updates.views !== undefined);

        if (!isViewsIncrementOnly) {
            // Authenticate user
            const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
            if (!token) {
                return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
            }

            const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
            }

            // Fetch video to check ownership
            const { data: video, error: fetchError } = await supabaseAdmin
                .from('videos')
                .select('owner_id')
                .eq('id', id)
                .maybeSingle();

            if (fetchError || !video) {
                return NextResponse.json({ error: 'Video not found' }, { status: 404 });
            }

            const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user.user_metadata?.role === 'admin' || user.role === 'admin';
            const isOwner = video.owner_id === user.id;

            if (!isAdmin && !isOwner) {
                return NextResponse.json({ error: 'Forbidden: You do not own this video' }, { status: 403 });
            }

            // Restrict featured and trending states modification to administrator only
            const modifiesFlags = updates.is_featured !== undefined || updates.is_trending !== undefined;
            if (modifiesFlags && !isAdmin) {
                return NextResponse.json({ error: 'Forbidden: Only administrators can toggle featured or trending states' }, { status: 403 });
            }
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

        // EPG Scheduling disabled - Live TV feature removed

        return NextResponse.json({ success: true, video: data });

    } catch (error) {
        console.error('[API] Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
