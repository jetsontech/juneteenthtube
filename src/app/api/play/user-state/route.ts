import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function getUserIdAndGuestId(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
  let userId: string | null = null;
  
  if (token) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    } catch {}
  }

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
  try {
    const { userId, guestId } = await getUserIdAndGuestId(req);
    const activeId = userId || guestId;

    if (!activeId) {
      return NextResponse.json({
        points: 0,
        level: 1,
        completedPuzzles: [],
        achievements: []
      });
    }

    // 1. Fetch points and level (upsert if not exists)
    let points = 0;
    let level = 1;
    
    const { data: pointsData, error: pointsErr } = await supabaseAdmin
      .from('cq_points')
      .select('points, level')
      .eq('user_id', activeId)
      .maybeSingle();

    if (pointsErr) throw pointsErr;

    if (pointsData) {
      points = pointsData.points;
      level = pointsData.level;
    } else {
      // Upsert a default row for the user
      await supabaseAdmin.from('cq_points').insert({
        user_id: activeId,
        points: 0,
        level: 1
      });
    }

    // 2. Fetch completed puzzles
    const { data: progressData, error: progressErr } = await supabaseAdmin
      .from('cq_puzzle_progress')
      .select('puzzle_id, completed, score')
      .eq('user_id', activeId);

    if (progressErr) throw progressErr;

    // 3. Fetch achievements
    const { data: achievementData, error: achErr } = await supabaseAdmin
      .from('cq_achievements')
      .select('achievement, created_at')
      .eq('user_id', activeId);

    if (achErr) throw achErr;

    return NextResponse.json({
      points,
      level,
      completedPuzzles: progressData || [],
      achievements: (achievementData || []).map(a => a.achievement)
    });

  } catch (e) {
    console.error("Failed to fetch user play state:", e);
    return NextResponse.json({ error: 'Failed to fetch user state' }, { status: 500 });
  }
}
