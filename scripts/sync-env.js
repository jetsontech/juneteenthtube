const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

const keysToSync = [
    'S3_BUCKET_NAME',
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_PUBLIC_DOMAIN' // Optional but good to have if present
];

console.log('Starting Vercel Environment Sync...');

keysToSync.forEach(key => {
    const line = envLines.find(l => l.startsWith(`${key}=`));
    if (line) {
        const value = line.split('=')[1].trim();
        if (value) {
            console.log(`Syncing ${key}...`);
            try {
                // Remove existing to avoid duplicates/errors
                try {
                    execSync(`echo y | vercel env rm ${key} production`, { stdio: 'pipe' });
                } catch (e) {
                    // Ignore error if it doesn't exist
                }

                // Add new value
                // Using echo to pipe input to prompts if needed, though arguments usually suffice
                // Vercel CLI syntax: vercel env add <name> [environment]
                // It prompts for value. We can pipe it.
                execSync(`echo "${value}" | vercel env add ${key} production`, { stdio: 'inherit' });
                console.log(`✅ ${key} synced.`);
            } catch (error) {
                console.error(`❌ Failed to sync ${key}:`, error.message);
            }
        }
    } else {
        console.warn(`⚠️  ${key} not found in .env.local`);
    }
});

console.log('Sync complete! Run "vercel deploy --prod" to apply changes.');
