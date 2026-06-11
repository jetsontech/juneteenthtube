const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Querying table names via exec_sql...');
    const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    `;
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) {
        console.error('RPC Error:', error);
        
        console.log('Trying fallback view/select...');
        const { data: fallbackData, error: fallbackError } = await supabase.from('videos').select('id').limit(1);
        if (fallbackError) {
            console.error('Videos table select failed:', fallbackError);
        } else {
            console.log('Videos table exists! Sample:', fallbackData);
        }
    } else {
        console.log('Tables found:', data);
    }
}

check().catch(console.error);
