import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Security check
        const authHeader = req.headers.get("Authorization")?.split(' ')[1];
        const { data: { user } } = await supabaseAdmin.auth.getUser(
            authHeader || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || ''
        );

        const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
            user?.user_metadata?.role === 'admin' ||
            user?.role === 'admin';

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { channelData } = body;

        if (!channelData || !channelData.name || !channelData.stream_url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('channels')
            .insert([channelData])
            .select()
            .single();

        if (error) {
            console.error("Create Failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, channel: data });
    } catch (error) {
        console.error("Create Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
