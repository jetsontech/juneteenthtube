import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const guestId = req.headers.get("x-guest-id");

    if (!videoId) {
        return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    // 1. Get total likes text='like'
    const { count: likesCount, error: likesError } = await supabaseAdmin
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", videoId)
        .eq("type", "like");

    // 2. Get user status if guestId is present
    let userStatus = null; // 'like' | 'dislike' | null
    if (guestId) {
        const { data } = await supabaseAdmin
            .from("likes")
            .select("type")
            .eq("video_id", videoId)
            .eq("guest_id", guestId)
            .single();

        if (data) userStatus = data.type;
    }

    if (likesError) {
        return NextResponse.json({ error: likesError.message }, { status: 500 });
    }

    return NextResponse.json({
        likes: likesCount || 0,
        userStatus
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoId, type } = body; // type: 'like' | 'dislike'
        const guestId = req.headers.get("x-guest-id");

        if (!videoId || !type || !guestId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check if exists
        const { data: existing } = await supabaseAdmin
            .from("likes")
            .select("id, type")
            .eq("video_id", videoId)
            .eq("guest_id", guestId)
            .single();

        if (existing) {
            if (existing.type === type) {
                // Toggle OFF (Remove like)
                await supabaseAdmin.from("likes").delete().eq("id", existing.id);
                return NextResponse.json({ status: "removed" });
            } else {
                // Change status (Like -> Dislike or vice versa)
                await supabaseAdmin.from("likes").update({ type }).eq("id", existing.id);
                return NextResponse.json({ status: "updated", type });
            }
        } else {
            // Insert new
            await supabaseAdmin.from("likes").insert({
                video_id: videoId,
                guest_id: guestId,
                type: type
            });
            return NextResponse.json({ status: "added", type });
        }

    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
