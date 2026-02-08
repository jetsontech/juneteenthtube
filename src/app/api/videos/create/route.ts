import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, video_url, thumbnail_url, category, duration, state, transcode_status } = body;

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert([
        {
          title,
          video_url,
          thumbnail_url: thumbnail_url || "",
          category,
          duration,
          state,
          transcode_status
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
