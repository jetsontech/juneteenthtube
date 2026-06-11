require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, transcode_status');

        if (error) {
            console.error('Error fetching from Supabase:', error.message);
            return;
        }

        const completed = data.filter(v => v.transcode_status === 'completed').length;
        const failed = data.filter(v => v.transcode_status === 'failed').length;
        const pending = data.filter(v => v.transcode_status !== 'completed' && v.transcode_status !== 'failed').length;

        console.clear();
        console.log('--- Transcode Batch Status ---');
        console.log(`Time: ${new Date().toLocaleTimeString()}`);
        console.log(`Completed: ${completed}`);
        console.log(`Failed:    ${failed}`);
        console.log(`Pending:   ${pending}`);
        console.log('------------------------------');
        console.log('Press Ctrl+C to stop polling.');

    } catch (err) {
        console.error('Error:', err);
    }
}

// Run immediately, then every 5 seconds
checkStatus();
setInterval(checkStatus, 5000);
