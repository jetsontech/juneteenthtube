import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VAULT_VIDEOS = [
    {
        title: "Within Our Gates",
        year: "1920",
        director: "Oscar Micheaux",
        url: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
        duration: "1:19:00",
        category: "J-Tube Originals",
        description: "Directed by Oscar Micheaux, this is the oldest surviving film by an African American director."
    },
    {
        title: "African American Home Movies (1950s)",
        year: "1950s",
        director: "Unknown",
        url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
        duration: "12:00",
        category: "J-Tube Originals",
        description: "Precious mid-century home movies capturing everyday African American family life."
    },
    {
        title: "The Symbol of the Unconquered",
        year: "1920",
        director: "Oscar Micheaux",
        url: "https://archive.org/download/TheSymbolOfTheUnconquered1920/The%20Symbol%20Of%20the%20Unconquered%20%281920%29.mp4",
        duration: "1:08:00",
        category: "J-Tube Originals",
        description: "Oscar Micheaux's bold silent film follows Eve Mason, a young Black woman who travels west to claim land."
    },
    {
        title: "Body and Soul",
        year: "1925",
        director: "Oscar Micheaux",
        url: "https://archive.org/download/body-and-soul_202107/Body%20and%20Soul.mp4",
        duration: "1:42:00",
        category: "J-Tube Originals",
        description: "Paul Robeson's screen debut. Robeson plays dual roles — a corrupt preacher and his virtuous twin brother."
    },
    {
        title: "The Scar of Shame",
        year: "1927",
        director: "Frank Peregini",
        url: "https://archive.org/download/the-scar-of-shame_1927/the-scar-of-shame_1927.ia.mp4",
        duration: "1:26:00",
        category: "J-Tube Originals",
        description: "A landmark silent melodrama exploring class divisions within the Black community."
    },
    {
        title: "Murder in Harlem",
        year: "1935",
        director: "Oscar Micheaux",
        url: "https://archive.org/download/Murder_in_Harlem/MurderInHarlem.mp4",
        duration: "1:36:00",
        category: "J-Tube Originals",
        description: "Oscar Micheaux's gripping courtroom drama follows a Black night watchman falsely accused of murder."
    },
    {
        title: "Lying Lips",
        year: "1939",
        director: "Oscar Micheaux",
        url: "https://archive.org/download/lying_lips/lying_lips.mp4",
        duration: "1:08:00",
        category: "J-Tube Originals",
        description: "Micheaux's late-career mystery follows a nightclub singer wrongly accused of murder."
    },
    {
        title: "The Blood of Jesus",
        year: "1941",
        director: "Spencer Williams",
        url: "https://archive.org/download/blood_of_jesus/blood_of_jesus.mp4",
        duration: "57:00",
        category: "J-Tube Originals",
        description: "Spencer Williams' masterpiece and the first race film inducted into the National Film Registry."
    },
    {
        title: "The Bronze Buckaroo",
        year: "1939",
        director: "Richard C. Kahn",
        url: "https://archive.org/download/bronze_buckaroo/the_bronze_buckaroo.mp4",
        duration: "58:00",
        category: "J-Tube Originals",
        description: "Starring Herb Jeffries as singing cowboy Bob Blake, this pioneering Black Western gave audience their own hero."
    },
    {
        title: "Harlem Rides the Range",
        year: "1939",
        director: "Richard C. Kahn",
        url: "https://archive.org/download/HarlemRidesTheRange/Harlem%20Rides%20The%20Range.mp4",
        duration: "54:00",
        category: "J-Tube Originals",
        description: "Herb Jeffries returns as Bob Blake in this all-Black Western investigating a radium mine conspiracy."
    },
    {
        title: "Two-Gun Man from Harlem",
        year: "1938",
        director: "Richard C. Kahn",
        url: "https://archive.org/download/Two-gunManFromHarlem/Two-gunManFromHarlem.mp4",
        duration: "1:03:00",
        category: "J-Tube Originals",
        description: "A B-western with an all-Black cast featuring Spencer Williams and comedian Mantan Moreland."
    },
    {
        title: "Hi-De-Ho",
        year: "1947",
        director: "Josh Binney",
        url: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
        duration: "1:12:00",
        category: "J-Tube Originals",
        description: "Cab Calloway plays himself in this musical race film set in the world of Harlem nightclubs."
    },
    {
        title: "A Study of Negro Artists",
        year: "1933",
        director: "Unknown",
        url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
        duration: "18:00",
        category: "J-Tube Originals",
        description: "Rare 1930s documentary capturing the vibrant Harlem Renaissance art scene."
    },
    {
        title: "The Negro Soldier",
        year: "1944",
        director: "Stuart Heisler",
        url: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
        duration: "40:00",
        category: "J-Tube Originals",
        description: "Produced by Frank Capra, this groundbreaking WWII documentary chronicles African American contributions."
    },
    {
        title: "The Heritage of Slavery",
        year: "1968",
        director: "CBS News",
        url: "https://archive.org/download/TheHeritageOfSlavery/The%20Heritage%20Of%20Slavery.mp4",
        duration: "52:00",
        category: "J-Tube Originals",
        description: "CBS News' searing 1968 documentary examining the enduring impact of slavery on American society."
    },
    {
        title: "Black History: Lost, Stolen, or Strayed (Pt 1)",
        year: "1968",
        director: "Perry Wolff",
        url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
        duration: "27:00",
        category: "J-Tube Originals",
        description: "Narrated by Bill Cosby, this documentary examines how Black contributions were systematically erased."
    },
    {
        title: "Black History: Lost, Stolen, or Strayed (Pt 2)",
        year: "1968",
        director: "Perry Wolff",
        url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel2.mp4",
        duration: "27:00",
        category: "J-Tube Originals",
        description: "The powerful conclusion examines the Civil Rights era, the fight for equality, and institutional racism."
    },
    {
        title: "1619: Up from Slavery",
        year: "2000",
        director: "PBS",
        url: "https://archive.org/download/1619UpFromSlavery/1619%20Up%20From%20Slavery%2001.mp4",
        duration: "1:30:00",
        category: "J-Tube Originals",
        description: "A sweeping documentary tracing the African American experience from 1619 to the present."
    },
    {
        title: "The March on Washington",
        year: "1963",
        director: "U.S. Information Agency",
        url: "https://archive.org/download/gov.archives.arc.49737/gov.archives.arc.49737_512kb.mp4",
        duration: "30:00",
        category: "J-Tube Originals",
        description: "Official NARA documentary of the historic 1963 March on Washington for Jobs and Freedom."
    },
    {
        title: "Wings for This Man",
        year: "1945",
        director: "U.S. Army Air Forces",
        url: "https://archive.org/download/WingsForThisMan/WingsForThisMan_512kb.mp4",
        duration: "12:00",
        category: "J-Tube Originals",
        description: "The story of the Tuskegee Airmen — the first African American military aviators in the U.S."
    },
    {
        title: "Rock 'n' Roll Revue",
        year: "1955",
        director: "Joseph Kohn",
        url: "https://archive.org/download/rock-n-roll-revue-1955/Rock%20%27n%27%20Roll%20Revue%20%281955%29.mp4",
        duration: "1:10:00",
        category: "J-Tube Originals",
        description: "Live from Harlem's Apollo Theater — Duke Ellington, Nat King Cole, and more."
    }
];

export async function POST(req: NextRequest) {
    try {
        // 1. Get the channel ID for "J-Tube Originals"
        const { data: channelData, error: channelError } = await supabaseAdmin
            .from('channels')
            .select('id')
            .eq('name', 'J-Tube Originals')
            .single();

        if (channelError || !channelData) {
            return NextResponse.json({ error: 'J-Tube Originals channel not found' }, { status: 404 });
        }

        const channelId = channelData.id;
        let syncedCount = 0;
        let scheduledCount = 0;

        // 2. Fetch all existing videos to mapping
        const { data: allVideos } = await supabaseAdmin.from('videos').select('id, video_url');
        const videoMap = new Map(allVideos?.map(v => [v.video_url, v.id]));

        // 3. Ensure all vault videos are in DB (Batched)
        const missingVideos = VAULT_VIDEOS.filter(v => !videoMap.has(v.url));
        if (missingVideos.length > 0) {
            const { data: newVs, error: vErr } = await supabaseAdmin.from('videos').insert(
                missingVideos.map(v => ({
                    title: v.title,
                    video_url: v.url,
                    category: v.category,
                    duration: v.duration,
                    transcode_status: 'completed',
                    state: 'published',
                    owner_id: null
                }))
            ).select('id, video_url');

            if (!vErr && newVs) {
                newVs.forEach(v => videoMap.set(v.video_url, v.id));
                syncedCount = newVs.length;
            }
        }

        // 4. Fill the next 48 hours (Batched)
        const now = new Date();
        const futureWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const { data: latestEpg } = await supabaseAdmin
            .from('epg_data')
            .select('end_time')
            .eq('channel_id', channelId)
            .gte('end_time', now.toISOString())
            .order('end_time', { ascending: false })
            .limit(1)
            .maybeSingle();

        let currentTime = now;
        if (latestEpg?.end_time) {
            currentTime = new Date(latestEpg.end_time);
        }

        const epgInserts = [];
        let videoIdx = 0;
        let safetyCounter = 0;

        while (currentTime < futureWindow && epgInserts.length < 100 && safetyCounter < 500) {
            safetyCounter++;
            const video = VAULT_VIDEOS[videoIdx % VAULT_VIDEOS.length];
            videoIdx++;

            const videoId = videoMap.get(video.url);
            if (!videoId) {
                // If we've checked all videos and found none, break to avoid infinite loop
                if (videoIdx >= VAULT_VIDEOS.length) break;
                continue;
            }

            let durationSeconds = 1800;
            if (video.duration.includes(':')) {
                const parts = video.duration.split(':').map(Number);
                if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
            }

            const endTime = new Date(currentTime.getTime() + durationSeconds * 1000);

            epgInserts.push({
                channel_id: channelId,
                video_id: videoId,
                title: video.title,
                start_time: currentTime.toISOString(),
                end_time: endTime.toISOString(),
                description: "J-Tube Vault Selection"
            });

            currentTime = endTime;
        }

        if (epgInserts.length > 0) {
            const { error: epgErr } = await supabaseAdmin.from('epg_data').insert(epgInserts);
            if (epgErr) throw epgErr;
            scheduledCount = epgInserts.length;
        }

        return NextResponse.json({
            success: true,
            syncedCount,
            scheduledCount,
            scheduledUntil: currentTime.toISOString()
        });
    } catch (error: any) {
        console.error('Vault Rotation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
