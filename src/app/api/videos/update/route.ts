
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
        const { id, title, thumbnail_url, views, video_url } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing Video ID' }, { status: 400 });
        }

        const updates: any = {};
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

        return NextResponse.json({ success: true, video: data });

    } catch (error) {
        console.error('[API] Unexpected Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
