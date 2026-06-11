import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: NextRequest) {
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
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('channels')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Status Update Failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, channel: data });
    } catch (error) {
        console.error("Status Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
