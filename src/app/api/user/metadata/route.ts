import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const body = await req.json();
        const { avatar_url } = body;

        // In a real app, you'd get the user ID from the session cookie or JWT
        // For this implementation, we'll assume the client is authorized
        // and we'll need the user ID. But since we want to be secure,
        // we'll use the supabase-js auth helper if possible.

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
            req.headers.get('Authorization')?.split(' ')[1] || ""
        );

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { user_metadata: { avatar_url } }
        );

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data.user });

    } catch (error) {
        console.error('[API] User Metadata Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
