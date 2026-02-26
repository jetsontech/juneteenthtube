require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Resetting failed transcodes...');
    const { data, error } = await supabase
        .from('videos')
        .update({ transcode_status: null })
        .eq('transcode_status', 'failed')
        .select('id, title, transcode_status');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Successfully reset ${data.length} videos to be transcoded again.`);
        console.log(data);
    }
}

run();
