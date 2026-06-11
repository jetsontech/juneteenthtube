import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const guestId = req.headers.get("x-guest-id");
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");

    if (!userId && !guestId) {
        return NextResponse.json({ channels: [] });
    }

    try {
        let query = supabaseAdmin
            .from("subscriptions")
            .select("channel_name");

        if (userId) {
            query = query.eq("subscriber_id", userId);
        } else {
            query = query.eq("guest_id", guestId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const channels = data ? data.map(sub => sub.channel_name) : [];
        return NextResponse.json({ channels });
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("--- Error getting all subscriptions:", errorMsg);
        return NextResponse.json({ channels: [], error: errorMsg }, { status: 500 });
    }
}
