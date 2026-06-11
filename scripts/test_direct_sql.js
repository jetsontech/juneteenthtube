const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Inserting into _sql...');
    const { data, error } = await supabase.from('_sql').insert({ query: 'SELECT 1;' });
    if (error) {
        console.error('Error querying _sql:', error);
    } else {
        console.log('Successfully inserted into _sql! Data:', data);
    }
}

check().catch(console.error);
