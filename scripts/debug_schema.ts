
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking schema...");

    const checkTable = async (table: string) => {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`❌ Table '${table}' check failed: ${error.message}`);
            return false;
        }
        console.log(`✅ Table '${table}' exists.`);
        return true;
    };

    await checkTable('videos');
    await checkTable('comments');
    await checkTable('likes');
    await checkTable('subscriptions');
}

checkSchema();
