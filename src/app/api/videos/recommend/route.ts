import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the embedding for the current video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('embedding')
      .eq('id', videoId)
      .single();

    if (videoError || !video?.embedding) {
      // If the video has no embedding or vector DB is not setup, return empty to trigger fallback
      return NextResponse.json({ recommendations: [] });
    }

    // 2. Call the pgvector similarity search function
    const { data: matches, error: matchError } = await supabase.rpc('match_videos', {
      query_embedding: video.embedding,
      match_threshold: 0.5, // Return anything with > 50% similarity
      match_count: 10,
      exclude_id: videoId
    });

    if (matchError) {
       console.warn("pgvector match failed. Did you run the SQL script? Fallback will be used.", matchError);
       return NextResponse.json({ recommendations: [] });
    }

    const recommendations = (matches as Array<{ id: string }> | null | undefined)?.map((m) => m.id) || [];
    return NextResponse.json({ recommendations });

  } catch (error: unknown) {
    console.error('Recommendation API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
