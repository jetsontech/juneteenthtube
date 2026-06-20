import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to authenticate user from headers/cookies
async function getUserIdAndGuestId(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
  let userId: string | null = null;
  
  if (token) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    } catch (e) {
      console.warn("Failed to get authenticated user in likes API:", e);
    }
  }

  // Fallback to x-user-id header only in development/internal context if needed, 
  // but prioritize token validation for security.
  if (!userId) {
    const headerUserId = req.headers.get('x-user-id');
    if (headerUserId && headerUserId !== 'undefined') {
      userId = headerUserId;
    }
  }

  const guestId = req.headers.get('x-guest-id') || null;
  return { userId, guestId };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ likes: 0, userStatus: null });
  }

  const { userId, guestId } = await getUserIdAndGuestId(req);

  // Count total 'like' type likes
  const { count } = await supabaseAdmin
    .from('likes')
    .select('*', { count: 'planned', head: true })
    .eq('video_id', videoId)
    .eq('type', 'like');

  // Check the current user's specific status (like / dislike)
  let userStatus: string | null = null;
  if (userId || guestId) {
    let query = supabaseAdmin
      .from('likes')
      .select('type')
      .eq('video_id', videoId);
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (guestId) {
      query = query.eq('guest_id', guestId);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      userStatus = data.type || 'like';
    }
  }

  return NextResponse.json({
    likes: count || 0,
    userStatus: userStatus
  });
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, type = 'like' } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: 'missing videoId' }, { status: 400 });
    }

    const { userId, guestId } = await getUserIdAndGuestId(req);

    if (!userId && !guestId) {
      return NextResponse.json({ error: 'unauthorized or missing guest identification' }, { status: 401 });
    }

    // Check if user/guest already has a like/dislike on this video
    let query = supabaseAdmin
      .from('likes')
      .select('id, type')
      .eq('video_id', videoId);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('guest_id', guestId);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      if (existing.type === type) {
        // Toggle OFF if types match
        await supabaseAdmin.from('likes').delete().eq('id', existing.id);
        return NextResponse.json({ action: 'removed' });
      } else {
        // Update type if it changed (e.g. from like to dislike)
        await supabaseAdmin
          .from('likes')
          .update({ type })
          .eq('id', existing.id);
        return NextResponse.json({ action: 'updated', type });
      }
    }

    // Insert new like/dislike record
    await supabaseAdmin.from('likes').insert({
      video_id: videoId,
      type,
      user_id: userId || null,
      guest_id: userId ? null : guestId
    });

    return NextResponse.json({ action: 'inserted', type });

  } catch (e) {
    console.error("Like toggle failed:", e);
    return NextResponse.json({ error: 'like failed' }, { status: 500 });
  }
}

