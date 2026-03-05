import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Security check
        const { data: { user } } = await supabaseAdmin.auth.getUser(
            req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || ''
        );
        const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user?.user_metadata?.role === 'admin' || user?.role === 'admin';

        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { channels } = body;

        if (!channels || !Array.isArray(channels)) {
            return NextResponse.json({ error: "Invalid channels payload" }, { status: 400 });
        }

        // Execute all updates simultaneously
        const results = await Promise.all(
            channels.map(c =>
                supabaseAdmin.from('channels')
                    .update({ order_index: c.order_index })
                    .eq('id', c.id)
                    .select()
            )
        );

        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            console.error("Failed to reorder some channels", failed);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reorder Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
