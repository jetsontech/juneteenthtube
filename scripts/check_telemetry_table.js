const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Querying analytics_events table directly...');
    const { data, error } = await supabase.from('analytics_events').select('*').limit(1);
    if (error) {
        console.error('Error querying analytics_events:', error);
    } else {
        console.log('Successfully queried analytics_events! Data:', data);
    }
}

check().catch(console.error);
