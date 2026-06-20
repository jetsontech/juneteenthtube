import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            userId,
            videoId,
            type,
            watchTime = 0,
            progress = 0
        } = body;

        // lightweight validation
        if (!videoId || !type) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        // send to Supabase (or your DB layer)
        await fetch(process.env.SUPABASE_URL + "/rest/v1/video_events", {
            method: "POST",
            headers: {
                apikey: process.env.SUPABASE_KEY!,
                Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: userId ?? "anon",
                video_id: videoId,
                event_type: type,
                watch_time: watchTime,
                progress
            })
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
