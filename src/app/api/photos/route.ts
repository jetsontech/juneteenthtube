import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching photos:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ photos: data || [] });
    } catch (err) {
        console.error('Unexpected error fetching photos:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, photo_url, caption, state } = body;

        if (!photo_url) {
            return NextResponse.json({ error: 'Missing photo_url' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('photos')
            .insert([{
                title: title || 'Untitled Photo',
                photo_url,
                caption: caption || '',
                state: state || 'GLOBAL'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error inserting photo:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ photo: data });
    } catch (err) {
        console.error('Unexpected error creating photo:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing photo ID' }, { status: 400 });
        }

        const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting photo:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Unexpected error deleting photo:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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
