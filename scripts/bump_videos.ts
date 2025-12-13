
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function bump() {
    const now = new Date();

    // 1. Drone View (as requested "2 dji" implies drone/aerial)
    const t1 = new Date(now.getTime() + 5000).toISOString();
    await supabase.from('videos').update({ created_at: t1 }).ilike('title', '%drone%');

    // 2. Juneteenth Stage (Assuming "Parade" or "Speech")
    // User said "Juneteenth Stage". I suspect "Mayor's Speech" (Stage) or "Parade".
    // Let's bump "Parade" clearly.
    const t2 = new Date(now.getTime() + 4000).toISOString();
    await supabase.from('videos').update({ created_at: t2 }).ilike('title', '%parade%');

    // 3. Maybe "Stage" implies "Live Music"?
    const t3 = new Date(now.getTime() + 3000).toISOString();
    await supabase.from('videos').update({ created_at: t3 }).ilike('title', '%speech%');

    console.log("Videos bumped!");
}

bump();
