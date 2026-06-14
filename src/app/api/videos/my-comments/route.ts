import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const token = req.headers.get("Authorization")?.split(' ')[1] || '';
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Get all videos owned by the user
        const { data: videos } = await supabaseAdmin
            .from('videos')
            .select('id, title, thumbnail_url')
            .eq('owner_id', user.id);

        if (!videos || videos.length === 0) {
            return NextResponse.json({ comments: [] });
        }

        const videoIds = videos.map(v => v.id);

        // Fetch all comments on these videos
        const { data: comments, error } = await supabaseAdmin
            .from('comments')
            .select('*')
            .in('video_id', videoIds)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        // Map comments and attach video info
        const mappedComments = comments.map(comment => {
            const video = videos.find(v => v.id === comment.video_id);
            return {
                id: comment.id,
                text: comment.content,
                user: comment.user_name || 'Guest',
                timestamp: comment.created_at,
                videoTitle: video?.title || 'Unknown Video',
                videoThumbnail: video?.thumbnail_url || '',
                videoId: comment.video_id
            };
        });

        return NextResponse.json({ comments: mappedComments });
    } catch (error) {
        console.error("Error fetching creator comments:", error);
        return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
    }
}
