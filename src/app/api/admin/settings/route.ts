import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const getSettingsPath = () => path.join(process.cwd(), 'src/data/settings.json');

export async function GET() {
    try {
        const filePath = getSettingsPath();
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            return NextResponse.json(JSON.parse(content));
        }
        return NextResponse.json({ pauseOrganicTrending: false });
    } catch (e) {
        console.error("Failed to read settings in GET API:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // Authenticate admin
        const token = req.headers.get("Authorization")?.split(' ')[1] || req.cookies.get('sb-fybxhwpkujbodlfoadem-auth-token')?.value || '';
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 });
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session token' }, { status: 401 });
        }

        const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || user.user_metadata?.role === 'admin' || user.role === 'admin';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        const body = await req.json();
        const { pauseOrganicTrending } = body;

        if (pauseOrganicTrending === undefined) {
            return NextResponse.json({ error: 'Missing pauseOrganicTrending parameter' }, { status: 400 });
        }

        const filePath = getSettingsPath();
        const settings = { pauseOrganicTrending: !!pauseOrganicTrending };

        // Ensure data directory exists
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
        console.log(`[Settings API] Successfully updated pauseOrganicTrending to ${pauseOrganicTrending}`);

        return NextResponse.json({ success: true, settings });
    } catch (e) {
        console.error("Failed to save settings in POST API:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
