import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: featured } = await supabaseAdmin
            .from('videos')
            .select('id, title, thumbnail_url, is_featured, is_trending')
            .eq('is_featured', true)
            .or('state.neq.HIDDEN,state.is.null')
            .order('created_at', { ascending: false });

        const { data: trending } = await supabaseAdmin
            .from('videos')
            .select('id, title, thumbnail_url, is_featured, is_trending')
            .eq('is_trending', true)
            .or('state.neq.HIDDEN,state.is.null')
            .order('created_at', { ascending: false });

        return NextResponse.json({ featured: featured || [], trending: trending || [] });
    } catch (error) {
        console.error("Error fetching curated videos:", error);
        return NextResponse.json({ featured: [], trending: [] }, { status: 500 });
    }
}
