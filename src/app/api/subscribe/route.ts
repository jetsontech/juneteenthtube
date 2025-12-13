import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

// Toggle Subscription
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { channelName } = body;
        const guestId = req.headers.get("x-guest-id");

        if (!channelName || !guestId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Check existing
        const { data: existing } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("channel_name", channelName)
            .eq("guest_id", guestId)
            .single();

        if (existing) {
            // Unsubscribe
            await supabaseAdmin.from("subscriptions").delete().eq("id", existing.id);
            return NextResponse.json({ subscribed: false });
        } else {
            // Subscribe
            await supabaseAdmin.from("subscriptions").insert({
                channel_name: channelName,
                guest_id: guestId
            });
            return NextResponse.json({ subscribed: true });
        }

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get("channelName");
    const guestId = req.headers.get("x-guest-id");

    if (!channelName || !guestId) {
        return NextResponse.json({ subscribed: false });
    }

    const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("channel_name", channelName)
        .eq("guest_id", guestId)
        .single();

    return NextResponse.json({ subscribed: !!data });
}
