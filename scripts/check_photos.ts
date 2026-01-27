import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking photos table...');
    const { data, error } = await supabase
        .from('photos')
        .select('id, title, created_at')
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} photos:`);
        data.forEach(p => console.log(` - ${p.title} (${p.id})`));
    }
}

check();
