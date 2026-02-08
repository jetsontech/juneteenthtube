import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  // Check if the current user (if any) liked the video
  // For now, just getting the count
  const { count, error } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0, hasLiked: false });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, userId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    // Toggle like (simple implementation)
    // First check if it exists
    const { data: existing } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId || 'guest')
      .single();

    if (existing) {
      // Unlike
      await supabaseAdmin.from('likes').delete().eq('id', existing.id);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabaseAdmin.from('likes').insert({ 
        video_id: videoId, 
        user_id: userId || 'guest' 
      });
      return NextResponse.json({ liked: true });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
