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

export async function POST(req: NextRequest) {
  try {
    const { userId, guestId } = await getUserIdAndGuestId(req);
    const activeId = userId || guestId;

    if (!activeId) {
      return NextResponse.json({ error: 'unauthorized or missing guest identification' }, { status: 401 });
    }

    const { puzzleId, score = 100 } = await req.json();

    if (!puzzleId) {
      return NextResponse.json({ error: 'missing puzzleId' }, { status: 400 });
    }

    // 1. Record puzzle progress
    const { data: existingProgress, error: fetchProgErr } = await supabaseAdmin
      .from('cq_puzzle_progress')
      .select('completed')
      .eq('user_id', activeId)
      .eq('puzzle_id', puzzleId)
      .maybeSingle();

    if (fetchProgErr) throw fetchProgErr;

    const isRepeat = existingProgress?.completed === true;

    // Save progress
    const { error: progressErr } = await supabaseAdmin
      .from('cq_puzzle_progress')
      .upsert({
        user_id: activeId,
        puzzle_id: puzzleId,
        completed: true,
        score: score,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,puzzle_id'
      });

    if (progressErr) throw progressErr;

    // 2. Fetch current points and level
    let currentPoints = 0;
    let currentLevel = 1;

    const { data: pointsData, error: pointsErr } = await supabaseAdmin
      .from('cq_points')
      .select('points, level')
      .eq('user_id', activeId)
      .maybeSingle();

    if (pointsErr) throw pointsErr;

    if (pointsData) {
      currentPoints = pointsData.points;
      currentLevel = pointsData.level;
    }

    // Points calculation: only award points if not a repeat completion (to prevent farming)
    let pointsAwarded = 0;
    if (!isRepeat) {
      pointsAwarded = score;
    }

    const newPoints = currentPoints + pointsAwarded;
    
    // Level up calculation: flat 500 XP/Points per level
    const newLevel = Math.max(currentLevel, Math.floor(newPoints / 500) + 1);
    const leveledUp = newLevel > currentLevel;

    // Update user points table
    const { error: updatePointsErr } = await supabaseAdmin
      .from('cq_points')
      .upsert({
        user_id: activeId,
        points: newPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updatePointsErr) throw updatePointsErr;

    // 3. Achievements check
    const unlockedAchievements: string[] = [];

    // Check count of completed puzzles
    const { count: completedCount, error: countErr } = await supabaseAdmin
      .from('cq_puzzle_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', activeId)
      .eq('completed', true);

    if (countErr) throw countErr;

    const puzzlesCount = completedCount || 0;

    // Get current achievements
    const { data: existingAchievements } = await supabaseAdmin
      .from('cq_achievements')
      .select('achievement')
      .eq('user_id', activeId);

    const existingAchSet = new Set((existingAchievements || []).map(a => a.achievement));

    const checkAndUnlock = async (achName: string) => {
      if (!existingAchSet.has(achName)) {
        await supabaseAdmin.from('cq_achievements').insert({
          user_id: activeId,
          achievement: achName
        });
        unlockedAchievements.push(achName);
      }
    };

    // Unlocking achievements logic:
    if (puzzlesCount >= 1) {
      await checkAndUnlock('first_puzzle');
    }
    if (puzzlesCount >= 5) {
      await checkAndUnlock('puzzle_master');
    }
    if (score >= 150) {
      await checkAndUnlock('high_scorer');
    }

    return NextResponse.json({
      success: true,
      pointsAwarded,
      newPoints,
      newLevel,
      leveledUp,
      unlockedAchievements,
      isRepeat
    });

  } catch (e) {
    console.error("Failed to complete puzzle:", e);
    return NextResponse.json({ error: 'Failed to process puzzle completion' }, { status: 500 });
  }
}
