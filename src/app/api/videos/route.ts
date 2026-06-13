import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side client with admin privileges
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
        }

        // Authenticate the user
        const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
        }

        // Fetch video to check ownership
        const { data: video, error: fetchError } = await supabaseAdmin
            .from('videos')
            .select('owner_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError || !video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user.user_metadata?.role === 'admin' || user.role === 'admin';
        const isOwner = video.owner_id === user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden: You do not own this video' }, { status: 403 });
        }

        // 1. Delete from DB (Admin)
        const { error } = await supabaseAdmin.from('videos').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
