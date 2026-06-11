
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function list() {
    const { data, error } = await supabase.from('videos').select('id, title, created_at').order('created_at', { ascending: false });
    if (error) console.error(error);
    else console.table(data);
}

list();
