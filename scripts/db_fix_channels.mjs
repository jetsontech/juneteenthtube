import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    "https://fybxhwpkujbodlfoadem.supabase.co",
    "sb_secret_x7vnGjnAZoh-fRhNKaORYg_SF7n_0kC"
);

async function run() {
    console.log('--- Finding Big Buck Bunny ---');
    const { data: bbbVideos, error: err1 } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', '%buck bunny%');

    if (err1) console.error(err1);
    console.log('Big Buck Bunny videos:', bbbVideos);

    console.log('\n--- Finding Jam ---');
    const { data: jamVideos, error: err2 } = await supabase
        .from('videos')
        .select('id, title, category, video_url')
        .ilike('title', '%Jam%');

    if (err2) console.error(err2);
    console.log('Jam videos:', jamVideos);

    console.log('\n--- Finding SAREMBOK Channel ---');
    const { data: channels, error: err3 } = await supabase
        .from('channels')
        .select('id, name')
        .ilike('name', '%SAREMBOK%');

    if (err3) console.error(err3);
    console.log('Channels:', channels);
}

run();
