import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const MOCK_VIDEOS = [
    {
        id: "9217bd6c-5478-4029-b09d-640e19b6a319", // Preserve existing one
        title: "Juneteenth Parade Houston 2024 — Full Coverage",
        thumbnail_url: "https://images.unsplash.com/photo-1568283094541-11910ebafcf0?q=80&w=800",
        views: 142000,
        duration: "8:47",
        video_url: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Buffalo_Juneteenth_2016_CPUSA.webm",
        category: "Parade",
        state: "TX"
    },
    {
        id: "4d7c040d-d4bd-4e2b-b998-ef2757270e5b",
        title: "Freedom Songs of the South: A Musical Journey",
        thumbnail_url: "https://images.unsplash.com/photo-1516280440502-311548cb45b3?q=80&w=800",
        views: 89000,
        duration: "1:12:00",
        video_url: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
        category: "Music",
        state: "GA"
    },
    {
        id: "78ac83fb-980b-47e2-8ea7-5d070b4c8180",
        title: "Dr. Opal Lee: The Grandmother of Juneteenth",
        thumbnail_url: "https://images.unsplash.com/photo-1589578228447-e1e4cb8fece7?q=80&w=800",
        views: 214000,
        duration: "1:07",
        video_url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Presidential_Medial_of_Freedom_Recipient_-_Opal_Lee.webm",
        category: "History",
        state: "TX"
    },
    {
        id: "ba4215fb-e822-4a0b-93ff-4efc92150821",
        title: "Galveston Island Celebration: Where It All Began",
        thumbnail_url: "https://images.unsplash.com/photo-1623849313386-b408137cdcf1?q=80&w=800",
        views: 67000,
        duration: "1:19:00",
        video_url: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
        category: "History",
        state: "TX"
    },
    {
        id: "e44d3701-d820-410a-8bf3-50ec826f4f22",
        title: "Traditional Juneteenth Foods & Their African Roots",
        thumbnail_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
        views: 103000,
        duration: "12:00",
        video_url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
        category: "Food",
        state: "GLOBAL"
    },
    {
        id: "df8a2f42-45e0-47ee-9972-7476beaeab83",
        title: "Atlanta Freedom Fest: Full Keynote Address",
        thumbnail_url: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?q=80&w=800",
        views: 55000,
        duration: "40:00",
        video_url: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
        category: "Speeches",
        state: "GA"
    },
    {
        id: "1c28c89b-980b-488f-a99f-e30d1c95bb0d",
        title: "Chicago South Side Block Party 2024",
        thumbnail_url: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?q=80&w=800",
        views: 78000,
        duration: "58:00",
        video_url: "https://archive.org/download/bronze_buckaroo/the_bronze_buckaroo.mp4",
        category: "Parade",
        state: "IL"
    },
    {
        id: "9f0a2fb4-cf3d-4c8d-b94f-56efcb237e89",
        title: "Spoken Word: Letters to Freedom",
        thumbnail_url: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?q=80&w=800",
        views: 41000,
        duration: "18:00",
        video_url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "7ac72fa3-20e4-4d87-af9b-7ef82b3a4a82",
        title: "The Emancipation Proclamation: History Explained",
        thumbnail_url: "https://images.unsplash.com/photo-1588145226759-dd6082ddaa76?q=80&w=800",
        views: 189000,
        duration: "1:47",
        video_url: "https://upload.wikimedia.org/wikipedia/commons/9/96/Brief_History_of_Juneteenth.webm",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "8ad73fb8-cf56-4c3e-8eb3-5d8f9ba32b0a",
        title: "Within Our Gates",
        thumbnail_url: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=800",
        views: 1200000,
        duration: "1:19:00",
        video_url: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "d8ab2e7f-df00-4b82-82ef-5e78beae5c67",
        title: "The Symbol of the Unconquered",
        thumbnail_url: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=800",
        views: 850000,
        duration: "1:08:00",
        video_url: "https://archive.org/download/TheSymbolOfTheUnconquered1920/The%20Symbol%20Of%20the%20Unconquered%20%281920%29.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "c8e2fbcf-547e-4b28-ae7f-56de2ba4e6b1",
        title: "Body and Soul",
        thumbnail_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
        views: 2100000,
        duration: "1:42:00",
        video_url: "https://archive.org/download/body-and-soul_202107/Body%20and%20Soul.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "f8c2eab3-568b-47e2-8ea7-90efc82b4a1b",
        title: "The Bronze Buckaroo",
        thumbnail_url: "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev/thumbnails/dd4f9bb0-41c3-488d-9800-3191e93bb35c_1780196859478.jpg",
        views: 940000,
        duration: "58:00",
        video_url: "https://archive.org/download/bronze_buckaroo/the_bronze_buckaroo.mp4",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "ba1c2eab-df02-47ef-ae22-5e78bcafc22d",
        title: "Hi-De-Ho",
        thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
        views: 3500000,
        duration: "1:12:00",
        video_url: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "ff2eabcc-20ef-489e-ae00-cba983ef4a89",
        title: "The Negro Soldier",
        thumbnail_url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800",
        views: 5200000,
        duration: "40:00",
        video_url: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "78f2ecbb-cf8d-4eef-90ef-8efcb2ba4e12",
        title: "Black History: Lost, Stolen, or Strayed (Pt 1)",
        thumbnail_url: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=800",
        views: 1800000,
        duration: "27:00",
        video_url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
        category: "Speeches",
        state: "GLOBAL"
    },
    {
        id: "8af2ecba-568b-4b2a-bf3d-9d0a2fb4a8b2",
        title: "African American Family Life (Detroit)",
        thumbnail_url: "https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?q=80&w=800",
        views: 420000,
        duration: "12:00",
        video_url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "4bf2ea5d-cfdf-47ef-ae3d-9e0a2fb4a8b2",
        title: "The Scar of Shame",
        thumbnail_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800",
        views: 600000,
        duration: "1:26:00",
        video_url: "https://archive.org/download/the-scar-of-shame_1927/the-scar-of-shame_1927.ia.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "6af2ecba-568b-4b2d-bf3d-9d0a2fb4a8b2",
        title: "A Study of Negro Artists",
        thumbnail_url: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=800",
        views: 300000,
        duration: "18:00",
        video_url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
        category: "History",
        state: "GLOBAL"
    }
];

async function seed() {
    console.log("Seeding mock videos into Supabase (sanitized schema)...");

    // First fetch existing videos to avoid duplicate titles/urls
    const { data: existing, error: fetchErr } = await supabase.from('videos').select('id, title, video_url');
    if (fetchErr) {
        console.error("Error fetching existing:", fetchErr);
        process.exit(1);
    }

    const existingTitles = new Set((existing || []).map(v => v.title.toLowerCase()));
    const existingUrls = new Set((existing || []).map(v => v.video_url.toLowerCase()));

    let count = 0;

    for (const video of MOCK_VIDEOS) {
        if (existingTitles.has(video.title.toLowerCase()) || existingUrls.has(video.video_url.toLowerCase())) {
            console.log(`Video already exists: "${video.title}"`);
            continue;
        }

        const { error } = await supabase.from('videos').insert({
            id: video.id,
            title: video.title,
            description: `A classic and curated Juneteenth video: ${video.title}. Celebrating Black heritage and culture.`,
            thumbnail_url: video.thumbnail_url,
            video_url: video.video_url,
            views: video.views,
            duration: video.duration,
            category: video.category,
            state: video.state,
            transcode_status: 'completed', // These are static archive/wikimedia URLs, so mark complete
            is_featured: video.id === "9217bd6c-5478-4029-b09d-640e19b6a319", // Mark parade as featured
            is_trending: video.id === "78ac83fb-980b-47e2-8ea7-5d070b4c8180" // Mark Opal Lee as trending
        });

        if (error) {
            console.error(`Failed to insert "${video.title}":`, error);
        } else {
            console.log(`Successfully seeded: "${video.title}"`);
            count++;
        }
    }

    console.log(`Seeding complete. Inserted ${count} new videos.`);
    process.exit(0);
}

seed();
