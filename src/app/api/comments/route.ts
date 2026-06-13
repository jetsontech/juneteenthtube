import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('id, video_id, user_id, user_name, user_avatar, content, created_at, guest_id')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map database properties to the structure expected by the WatchClient/UI
  const formattedComments = (data || []).map(c => ({
    id: c.id,
    user: c.user_name || 'Guest',
    text: c.content || '',
    timestamp: c.created_at ? new Date(c.created_at).toLocaleString() : 'Recently'
  }));

  return NextResponse.json({ comments: formattedComments });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, text, userName, userId } = body;
    const guestId = req.headers.get('x-guest-id') || body.guestId;

    if (!videoId || !text) {
      return NextResponse.json({ error: 'Missing videoId or text content' }, { status: 400 });
    }

    // Authenticate user via token to prevent impersonation
    const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
    let authenticatedUser = null;
    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        authenticatedUser = user;
      }
    }

    // Block unauthenticated requests attempting to comment on behalf of a registered user
    if (userId && !authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized: Session token required for registered user actions' }, { status: 401 });
    }

    const finalUserId = authenticatedUser ? authenticatedUser.id : null;
    const finalUserName = authenticatedUser 
      ? (authenticatedUser.user_metadata?.full_name || authenticatedUser.email?.split('@')[0] || 'User') 
      : (userName || 'Guest');
    const finalGuestId = authenticatedUser ? null : guestId;

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert([
        {
          video_id: videoId,
          content: text,
          user_name: finalUserName,
          user_id: finalUserId,
          guest_id: finalGuestId
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Return mapped comment for UI addition
    const formattedComment = {
      id: data.id,
      user: data.user_name || 'Guest',
      text: data.content || '',
      timestamp: data.created_at ? new Date(data.created_at).toLocaleString() : 'Recently'
    };

    return NextResponse.json(formattedComment);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("--- Error posting comment:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
