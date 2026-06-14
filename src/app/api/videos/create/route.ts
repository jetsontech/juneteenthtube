import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, video_url, thumbnail_url, category, duration, state, transcode_status, owner_id } = body;

    // Authenticate user
    const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
    }

    const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user.user_metadata?.role === 'admin' || user.role === 'admin';
    if (owner_id && owner_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Cannot create video for another owner' }, { status: 403 });
    }

    const finalOwnerId = isAdmin ? (owner_id || user.id) : user.id;

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
          transcode_status,
          owner_id: finalOwnerId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger GitHub Actions transcoder via repository_dispatch
    if (data?.id && process.env.GITHUB_DISPATCH_TOKEN) {
      try {
        await fetch(
          'https://api.github.com/repos/jetsontech/culturequest-gh-transcoder/dispatches',
          {
            method: 'POST',
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
            },
            body: JSON.stringify({
              event_type: 'transcode',
              client_payload: {
                videoId: data.id,
                quality: 'master',
                crf: 16,
                preset: 'veryslow',
                audio_bitrate: '320k',
                dolby_vision: true,
                spatial_audio: true
              },
            }),
          }
        );
        console.log(`Dispatched transcode job for video ${data.id}`);
      } catch (dispatchErr) {
        console.error('Failed to dispatch transcode:', dispatchErr);
      }
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
