import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// GET /api/subscribe — checks if subscribed to a channel
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get('channelName');
    const guestId = req.headers.get("x-guest-id");
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");

    if (!channelName) {
        return NextResponse.json({ subscribed: false, error: 'Missing channelName' }, { status: 400 });
    }

    if (!userId && !guestId) {
        return NextResponse.json({ subscribed: false });
    }

    try {
        let query = supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("channel_name", channelName);

        if (userId) {
            query = query.eq("subscriber_id", userId);
        } else {
            query = query.eq("guest_id", guestId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        return NextResponse.json({ subscribed: !!data });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("--- Error getting subscription status:", errorMsg);
        return NextResponse.json({ subscribed: false, error: errorMsg }, { status: 500 });
    }
}

// POST /api/subscribe — toggles channel subscription
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { channelName, userId } = body;
        const guestId = req.headers.get("x-guest-id") || body.guestId;

        if (!channelName || (!guestId && !userId)) {
            return NextResponse.json({ error: 'Missing channelName, guestId, or userId' }, { status: 400 });
        }

        let query = supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("channel_name", channelName);

        if (userId) {
            query = query.eq("subscriber_id", userId);
        } else {
            query = query.eq("guest_id", guestId);
        }

        const { data: existing, error: fetchErr } = await query.maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existing) {
            // Unsubscribe
            const { error: deleteErr } = await supabaseAdmin
                .from("subscriptions")
                .delete()
                .eq("id", existing.id);

            if (deleteErr) throw deleteErr;

            return NextResponse.json({ subscribed: false, action: 'unsubscribed' });
        } else {
            // Subscribe
            const { error: insertErr } = await supabaseAdmin
                .from("subscriptions")
                .insert({
                    channel_name: channelName,
                    subscriber_id: userId || null,
                    guest_id: userId ? null : guestId
                });

            if (insertErr) throw insertErr;

            return NextResponse.json({ subscribed: true, action: 'subscribed' });
        }

    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("--- Error toggling subscription:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
