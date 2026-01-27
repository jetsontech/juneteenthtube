import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// FORCE use of ANON key to simulate frontend usage
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Testing access with ANON key (Public User)...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase
        .from('photos')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error fetching photos:', error.message);
        if (error.code === '42501') {
            console.log('💡 CAUSE: RLS Policy Violation (Permission Denied). Policies need to be updated.');
        }
    } else {
        console.log(`✅ Success! Found ${data.length} photos visible to public.`);
        if (data.length === 0) {
            console.log('⚠️  Zero photos found (RLS might be filtering rows to empty, or table is empty).');
        }
    }
}

check();
