import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const guestId = req.headers.get('x-guest-id');
  const userId = req.headers.get('x-user-id') || searchParams.get('userId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  // Count only likes (thumbs up)
  const { count, error } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId)
    .eq('type', 'like');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let userStatus: string | null = null;
  
  // Authenticate user via token to prevent impersonation
  const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
  let authenticatedUserId = null;
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      authenticatedUserId = user.id;
    }
  }

  const checkUserId = authenticatedUserId || userId;

  if (checkUserId) {
    const { data: userLike } = await supabaseAdmin
      .from('likes')
      .select('type')
      .eq('video_id', videoId)
      .eq('user_id', checkUserId)
      .maybeSingle();
      
    if (userLike) {
      userStatus = userLike.type;
    }
  } else if (guestId) {
    const { data: guestLike } = await supabaseAdmin
      .from('likes')
      .select('type')
      .eq('video_id', videoId)
      .eq('guest_id', guestId)
      .maybeSingle();
      
    if (guestLike) {
      userStatus = guestLike.type;
    }
  }

  return NextResponse.json({ likes: count || 0, userStatus });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, type, userId } = body; // type is 'like' or 'dislike'
    const guestId = req.headers.get('x-guest-id') || body.guestId;

    if (!videoId || (!guestId && !userId)) {
      return NextResponse.json({ error: 'Missing videoId, guestId, or userId' }, { status: 400 });
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

    // Block unauthenticated requests attempting to vote on behalf of a registered user
    if (userId && !authenticatedUser) {
      return NextResponse.json({ error: 'Unauthorized: Session token required for registered user actions' }, { status: 401 });
    }

    const finalUserId = authenticatedUser ? authenticatedUser.id : null;
    const finalGuestId = authenticatedUser ? null : guestId;

    // Attempt to find existing like by either user_id or guest_id
    let query = supabaseAdmin.from('likes').select('id, type').eq('video_id', videoId);
    
    if (finalUserId) {
      query = query.eq('user_id', finalUserId);
    } else {
      query = query.eq('guest_id', finalGuestId);
    }

    const { data: existing, error: fetchErr } = await query.maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) {
      if (existing.type === type) {
        // Toggle off if same type clicked again
        await supabaseAdmin.from('likes').delete().eq('id', existing.id);
        return NextResponse.json({ action: 'removed' });
      } else {
        // Switch type (like to dislike, or dislike to like)
        await supabaseAdmin.from('likes').update({ type }).eq('id', existing.id);
        return NextResponse.json({ action: 'updated', type });
      }
    } else {
      // Insert new like
      const { error: insertErr } = await supabaseAdmin.from('likes').insert({
        video_id: videoId,
        user_id: finalUserId || null,
        guest_id: finalUserId ? null : finalGuestId,
        type: type || 'like'
      });

      if (insertErr) throw insertErr;

      return NextResponse.json({ action: 'inserted', type });
    }

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("--- Error toggling like:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
