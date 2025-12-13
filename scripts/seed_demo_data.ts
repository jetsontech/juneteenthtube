
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from parent dir
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_VIDEOS = [
    {
        title: "Juneteenth Atlanta Parade 2024 - Full Highlights",
        description: "Experience the vibrant energy of the 2024 Juneteenth Atlanta Parade! Featuring marching bands, dance troupes, and community floats.",
        thumbnail_url: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&q=80",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder
        channel_name: "Juneteenth ATL Official",
        channel_avatar: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=100",
        views: "1.2M",
        duration: "14:20",
        category: "Parade",
        posted_at: "2 days ago"
    },
    {
        title: "Best Soul Food at the Festival 🍗",
        description: "Trying all the amazing food vendors at Centennial Olympic Park. You won't believe the BBQ!",
        thumbnail_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        channel_name: "ATL Foodie",
        channel_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
        views: "85K",
        duration: "8:45",
        category: "Food",
        posted_at: "5 hours ago"
    },
    {
        title: "History of Juneteenth: A Freedom Story",
        description: "Educational mini-documentary about the origins and significance of Juneteenth.",
        thumbnail_url: "https://images.unsplash.com/photo-1533552063836-e63c54d2427a?w=800&q=80",
        video_url: "",
        channel_name: "History buffs",
        channel_avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
        views: "250K",
        duration: "12:30",
        category: "History",
        posted_at: "1 week ago"
    },
    {
        title: "Live Music: drumline performance",
        description: "Incredible rhythm and energy from the Morris Brown marching band.",
        thumbnail_url: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&q=80",
        video_url: "",
        channel_name: "Marching Arts",
        channel_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        views: "45K",
        duration: "4:20",
        category: "Music",
        posted_at: "1 day ago"
    },
    {
        title: "Mayor's Speech Opening Ceremony",
        description: "Full speech from the main stage.",
        thumbnail_url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80",
        video_url: "",
        channel_name: "City of Atlanta",
        channel_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
        views: "12K",
        duration: "25:00",
        category: "Speeches",
        posted_at: "3 days ago"
    },
    {
        title: "Fireworks Finale Drone View 🎆",
        description: "Stunning 4K drone footage of the fireworks show.",
        thumbnail_url: "https://images.unsplash.com/photo-1498931299472-f7a63a029763?w=800&q=80",
        video_url: "",
        channel_name: "Drone ATL",
        channel_avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100",
        views: "890K",
        duration: "3:15",
        category: "Live",
        posted_at: "10 hours ago"
    },
    {
        title: "Community Dance Circle",
        description: "Join in the celebration!",
        thumbnail_url: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
        video_url: "",
        channel_name: "Dance Life",
        channel_avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100",
        views: "34K",
        duration: "5:50",
        category: "Parade",
        posted_at: "2 days ago"
    },
    {
        title: "Vendor Spotlight: Handmade Jewelry",
        description: "Checking out local artisans.",
        thumbnail_url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80",
        video_url: "",
        channel_name: "Support Local",
        channel_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        views: "5K",
        duration: "8:10",
        category: "2024",
        posted_at: "1 day ago"
    },
    // Duplicating to fill grid
    {
        title: "Jazz in the Park 🎷",
        description: "Smooth jazz afternoon set.",
        thumbnail_url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
        video_url: "",
        channel_name: "Jazz Café",
        channel_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
        views: "15K",
        duration: "45:00",
        category: "Music",
        posted_at: "6 hours ago"
    },
    {
        title: "Vegan BBQ Options?",
        description: "Yes, they exist and they are delicious.",
        thumbnail_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        video_url: "",
        channel_name: "Plant Based ATL",
        channel_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        views: "22K",
        duration: "6:20",
        category: "Food",
        posted_at: "3 days ago"
    }
];

async function seed() {
    console.log("Seeding demo videos...");

    for (const video of DEMO_VIDEOS) {
        const { error } = await supabase.from('videos').insert([
            {
                title: video.title,
                description: video.description,
                thumbnail_url: video.thumbnail_url,
                video_url: video.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                created_at: new Date().toISOString()
                // channel_name, views, etc will come from defaults in Context
            }
        ]);

        if (error) {
            console.error("Error inserting", video.title, error.message);
        } else {
            console.log("Inserted:", video.title);
        }
    }
}

seed();
