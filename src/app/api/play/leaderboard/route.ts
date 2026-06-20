import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch top 50 users from cq_points ordered by points desc
    const { data: pointsList, error: pointsErr } = await supabaseAdmin
      .from('cq_points')
      .select('user_id, points, level')
      .order('points', { ascending: false })
      .limit(50);

    if (pointsErr) throw pointsErr;

    if (!pointsList || pointsList.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // 2. Extract UUIDs to query profiles
    const userIds = pointsList
      .map(p => p.user_id)
      .filter(id => {
        // Only query UUIDs (guests might have arbitrary string keys)
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      });

    // 3. Query profiles in bulk
    const profilesMap = new Map<string, { username: string; avatar_url: string }>();
    if (userIds.length > 0) {
      const { data: profiles, error: profilesErr } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (!profilesErr && profiles) {
        profiles.forEach(p => {
          profilesMap.set(p.id, {
            username: p.username || 'Member',
            avatar_url: p.avatar_url || ''
          });
        });
      }
    }

    // 4. Map points list to output format
    const leaderboard = pointsList.map((entry, index) => {
      const profile = profilesMap.get(entry.user_id);
      
      let displayName = 'Guest';
      let avatarUrl = '';

      if (profile) {
        displayName = profile.username;
        avatarUrl = profile.avatar_url;
      } else {
        // It's a guest or has no profile yet
        // Clean display name by using last 4 characters of the ID
        const idStr = String(entry.user_id);
        const suffix = idStr.length > 4 ? idStr.slice(-4).toUpperCase() : idStr;
        displayName = `Guest-${suffix}`;
      }

      return {
        rank: index + 1,
        userId: entry.user_id,
        username: displayName,
        avatar: avatarUrl,
        points: entry.points,
        level: entry.level
      };
    });

    return NextResponse.json({ leaderboard });

  } catch (e) {
    console.error("Failed to fetch leaderboard:", e);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
