import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
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

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing Channel ID" }, { status: 400 });
        }

        // 1. Delete associated EPG data
        await supabaseAdmin.from('epg_data').delete().eq('channel_id', id);

        // 2. Delete the channel
        const { error } = await supabaseAdmin
            .from('channels')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Delete Failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
