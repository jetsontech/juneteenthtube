
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MISTAKE_ID = 'b38ae17e-6416-48d5-8d5c-3cedfe7484a5'; // The "Video 5" kept by mistake

async function deleteMistake() {
    console.log(`Deleting mistaken video: ${MISTAKE_ID}`);
    const { error } = await supabase.from('videos').delete().eq('id', MISTAKE_ID);

    if (error) console.error("Error:", error);
    else console.log("Success: Mistake deleted.");
}

deleteMistake();
