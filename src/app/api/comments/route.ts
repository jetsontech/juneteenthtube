import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Admin client to bypass RLS for guest operations if needed, 
// or just to ensure we can write to tables with our custom 'guest_id' logic safely.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
        return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { videoId, text, userName } = body;

        // Check for Guest ID header
        const guestId = req.headers.get("x-guest-id");
        // Ideally we also check for Auth Token but for this "Clone" we focus on Guest mostly as per user flow

        if (!videoId || !text) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("comments")
            .insert([
                {
                    video_id: videoId,
                    content: text,
                    user_name: userName || "Guest",
                    guest_id: guestId, // Store the UUID from local storage
                    // user_id: ... // We leave this null for guests
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Comment insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ comment: data });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
