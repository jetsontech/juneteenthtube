import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rateLimit';

// Configurable comments limits (defaults: 5 per min, 30 per hour, 100 per day)
const LIMIT_MINUTE = Number(process.env.COMMENT_LIMIT_MINUTE || 5);
const LIMIT_HOUR = Number(process.env.COMMENT_LIMIT_HOUR || 30);
const LIMIT_DAY = Number(process.env.COMMENT_LIMIT_DAY || 100);

const commentLimits = {
  minute: LIMIT_MINUTE,
  hour: LIMIT_HOUR,
  day: LIMIT_DAY
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'missing videoId' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('id, video_id, user_name, user_avatar, content, created_at')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ comments: [], fallback: true });
  }

  return NextResponse.json({
    comments: (data || []).map(c => ({
      id: c.id,
      user: c.user_name || 'Guest',
      avatar: c.user_avatar || '',
      text: c.content || '',
      timestamp: c.created_at || null
    }))
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Content size verification
    const body = await req.json();
    const { videoId, text, userName } = body;

    if (!videoId || !text || text.trim().length === 0) {
      return NextResponse.json({ error: 'missing fields or empty text' }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: 'Comment text exceeds 1000 characters limit' }, { status: 400 });
    }

    // 2. Authenticate user
    const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
    let userId: string | null = null;
    let displayName = userName || 'Guest';
    let userAvatar = '';

    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
          
          // Lookup display name & avatar from profiles
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', userId)
            .maybeSingle();

          if (profile) {
            if (profile.username) displayName = profile.username;
            if (profile.avatar_url) userAvatar = profile.avatar_url;
          }
        }
      } catch (authErr) {
        console.warn("Failed user auth check in comments API:", authErr);
      }
    }

    // 3. Rate Limiting check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown-ip';
    const guestId = req.headers.get('x-guest-id') || null;

    // Limit by IP
    const ipLimitOk = await checkRateLimit('comments', `ip:${ip}`, commentLimits);
    if (!ipLimitOk) {
      return NextResponse.json({ error: 'Too Many Requests (IP)' }, { status: 429 });
    }

    // Limit by User or Guest
    if (userId) {
      const userLimitOk = await checkRateLimit('comments', `user:${userId}`, commentLimits);
      if (!userLimitOk) {
        return NextResponse.json({ error: 'Too Many Requests (User)' }, { status: 429 });
      }
    } else if (guestId) {
      const guestLimitOk = await checkRateLimit('comments', `guest:${guestId}`, commentLimits);
      if (!guestLimitOk) {
        return NextResponse.json({ error: 'Too Many Requests (Session)' }, { status: 429 });
      }
    }

    // 4. Insert comment
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        video_id: videoId,
        content: text,
        user_name: displayName,
        user_avatar: userAvatar,
        user_id: userId || null,
        guest_id: userId ? null : guestId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      user: data.user_name,
      avatar: data.user_avatar,
      text: data.content,
      timestamp: data.created_at
    });

  } catch (e) {
    console.error("Comment post failed:", e);
    return NextResponse.json({ error: 'comment failed' }, { status: 500 });
  }
}

