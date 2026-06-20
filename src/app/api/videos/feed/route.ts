import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDisplayViews } from "@/lib/viewHelpers";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface DBVideo {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  views?: number | null;
  created_at: string;
  duration?: string | null;
  video_url: string;
  video_url_h264?: string | null;
  transcode_status?: string | null;
  owner_id?: string | null;
  posted_at?: string | null;
  category?: string | null;
  state?: string | null;
  channel_name?: string | null;
  channel_avatar?: string | null;
  is_featured?: boolean | null;
  is_trending?: boolean | null;
}

/* -------------------------------
   SAFE HELPERS
--------------------------------*/

function safeStr(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function safeNum(v: unknown) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

/* -------------------------------
   TIKTOK-STYLE SCORING ENGINE
--------------------------------*/

function scoreVideo(v: DBVideo, ctx: { category?: string; state?: string }) {
  const views = safeNum(v.views);

  const ageHours =
    (Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60);

  // 🔥 core ranking signals
  const freshness = Math.exp(-ageHours / 48); // decay curve (TikTok-like)
  const popularity = Math.log10(views + 1);

  // 🎯 boosts
  const featuredBoost = v.is_featured ? 2.5 : 0;
  const trendingBoost = v.is_trending ? 1.8 : 0;

  // 📍 personalization (lightweight)
  const categoryBoost =
    ctx.category && v.category === ctx.category ? 1.5 : 0;

  const stateBoost =
    ctx.state && v.state === ctx.state ? 1.2 : 0;

  return (
    popularity * 1.2 +
    freshness * 3 +
    featuredBoost +
    trendingBoost +
    categoryBoost +
    stateBoost
  );
}

/* -------------------------------
   MAIN FEED ROUTE
--------------------------------*/

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const category = searchParams.get("category") || undefined;
    const state = searchParams.get("state") || undefined;
    const feed = searchParams.get("feed") || "for_you";

    // 🧠 Pull candidate pool (overfetch for ranking)
    let dbQuery = supabaseAdmin
      .from("videos")
      .select(`
        id,
        title,
        thumbnail_url,
        views,
        created_at,
        duration,
        video_url,
        video_url_h264,
        transcode_status,
        owner_id,
        category,
        state,
        channel_name,
        channel_avatar,
        is_featured,
        is_trending
      `);

    // Apply state-driven filtering only for non-featured feeds (Featured Hero Carousel is a global showcase)
    if (state && state !== 'GLOBAL' && feed !== 'featured') {
      dbQuery = dbQuery.or(`state.eq.${state},state.eq.GLOBAL`);
    }

    if (category && category !== 'All' && category !== 'null') {
      dbQuery = dbQuery.eq('category', category);
    }

    // Hide non-user uploaded videos (owner_id is null) from everything EXCEPT the Legacy Vault
    if (category !== 'Vault') {
      dbQuery = dbQuery.not('owner_id', 'is', null);
    }

    // Exclude hidden/paused videos from all public feeds
    dbQuery = dbQuery.or('state.neq.HIDDEN,state.is.null');

    const { data, error } = await dbQuery.limit(200);

    if (error) {
      console.error("FEED ERROR:", error);
      return NextResponse.json({
        videos: [],
        total: 0,
        fallback: true,
        mode: "safe_fallback"
      });
    }

    const videos = (data as DBVideo[] || []);

    /* -------------------------------
       RANKING STEP (CORE ENGINE)
    --------------------------------*/

    let ranked = videos.map(v => ({
      ...v,
      _score: scoreVideo(v, { category, state })
    }));

    // feed modes
    if (feed === "trending") {
      ranked.sort((a, b) =>
        (b.is_trending ? 1 : 0) - (a.is_trending ? 1 : 0) ||
        b._score - a._score
      );
    } else if (feed === "featured") {
      ranked = ranked.filter(v => v.is_featured);
      ranked.sort((a, b) => b._score - a._score);
    } else {
      // 🎯 TikTok "For You"
      ranked.sort((a, b) => b._score - a._score);
    }

    /* -------------------------------
       PAGINATION (after ranking)
    --------------------------------*/

    const page = ranked.slice(offset, offset + limit);

    const base = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || process.env.S3_PUBLIC_DOMAIN || "https://media.culturequest.vip";
    console.log("[FEED API] env NEXT_PUBLIC_S3_PUBLIC_DOMAIN:", process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN);
    console.log("[FEED API] env S3_PUBLIC_DOMAIN:", process.env.S3_PUBLIC_DOMAIN);
    console.log("[FEED API] base:", base);

    const normalizeUrl = (url: string | null | undefined): string => {
      if (!url) return "";
      if (!url.startsWith('http') && !url.startsWith('/uploads/')) {
        if (url.startsWith('pub-efcc4aa0b3b24e3d97760577b0ec20bd/')) {
          return `${base}/${url.substring('pub-efcc4aa0b3b24e3d97760577b0ec20bd/'.length)}`;
        }
        return `${base}/${url.startsWith('/') ? url.slice(1) : url}`;
      }
      if (url.includes("cloudflarestorage.com")) {
        try {
          const urlObj = new URL(url);
          return `${base}${urlObj.pathname}`;
        } catch {
          return url.replace(/https?:\/\/[a-zA-Z0-9.-]+\.cloudflarestorage\.com/, base);
        }
      }
      return url;
    };

    const response = page.map(v => {
      const videoUrlH264 = v.video_url_h264 ? normalizeUrl(v.video_url_h264) : "";
      const thumbnail = v.thumbnail_url ? normalizeUrl(v.thumbnail_url) : "";
      const videoUrl = normalizeUrl(v.video_url);

      return {
        id: v.id,
        title: safeStr(v.title, "Untitled"),
        thumbnail: thumbnail,
        videoUrl: videoUrl,
        videoUrlH264: videoUrlH264 || undefined,
        transcodeStatus: v.transcode_status || undefined,
        ownerId: v.owner_id || undefined,

        views: getDisplayViews(v.id, safeNum(v.views)),

        duration: v.duration || "0:00",
        postedAt: v.posted_at || (v.created_at ? new Date(v.created_at).toLocaleDateString() : "Recently"),
        createdAt: v.created_at,

        category: v.category || "General",
        state: v.state || "GLOBAL",

        channelName: v.channel_name || "CultureQuestTV",
        channelAvatar: v.channel_avatar || "",

        isFeatured: !!v.is_featured,
        isTrending: !!v.is_trending
      };
    });

    /* -------------------------------
       FINAL RESPONSE (STABLE CONTRACT)
    --------------------------------*/

    return NextResponse.json({
      videos: response,
      total: ranked.length,
      mode: "tiktok_ranking_v3",
      ok: true
    });

  } catch (e) {
    console.error("FEED CRASH:", e);

    return NextResponse.json({
      videos: [],
      total: 0,
      fallback: true,
      mode: "safe_crash_recovery",
      ok: false
    });
  }
}
