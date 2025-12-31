import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running photos table migration...');

    const migrationPath = path.join(__dirname, '../migrations/create_photos_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon to run each statement separately
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
        if (!statement.trim()) continue;

        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
            console.error('Error executing statement:', error);
            console.error('Statement was:', statement);
            // Try direct approach
            const { error: directError } = await supabase.from('_sql').insert({ query: statement });
            if (directError) {
                console.error('Direct approach also failed:', directError);
            }
        } else {
            console.log('✓ Success');
        }
    }

    console.log('\nMigration complete!');
    console.log('Verifying photos table...');

    const { data, error } = await supabase.from('photos').select('*').limit(1);
    if (error) {
        console.error('Error verifying photos table:', error);
    } else {
        console.log('✓ Photos table exists and is accessible');
        console.log('Sample data:', data);
    }
}

runMigration().catch(console.error);
