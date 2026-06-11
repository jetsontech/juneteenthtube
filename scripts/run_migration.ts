
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found in .env.local");
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        const migration = fs.readFileSync(path.resolve(process.cwd(), 'supabase_migration_channels.sql'), 'utf8');
        console.log("Running migration...");
        await sql.unsafe(migration);
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

run();
