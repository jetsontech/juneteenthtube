import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://fybxhwpkujbodlfoadem.supabase.co",
    "sb_secret_x7vnGjnAZoh-fRhNKaORYg_SF7n_0kC"
);

async function run() {
    console.log('--- Finding all EPG Data titles ---');
    const { data: epg, error: err1 } = await supabase
        .from('epg_data')
        .select('id, title, channel_id, video_id, start_time, end_time');

    if (err1) console.error(err1);

    const uniqueTitles = [...new Set(epg?.map(e => e.title))];
    console.log('Unique EPG titles:', uniqueTitles);

    const bbbEpg = epg?.filter(e => e.title?.toLowerCase().includes('buck'));
    console.log('Big Buck EPG entries:', bbbEpg);

    const jamEpg = epg?.filter(e => e.title?.toLowerCase().includes('jam'));
    console.log('Jam EPG entries:', jamEpg);
}

run();
