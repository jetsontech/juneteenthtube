import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, photo_url, title, caption } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
        }

        const updateData: Record<string, string> = {};
        if (photo_url) updateData.photo_url = photo_url;
        if (title) updateData.title = title;
        if (caption !== undefined) updateData.caption = caption;

        const { error } = await supabase
            .from('photos')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('Error updating photo:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Unexpected error updating photo:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
