import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { supabase } from '../src/lib/supabase';

async function setupPhotosTable() {
    console.log('Setting up photos table...\n');

    // Step 1: Check if photos table exists
    console.log('1. Checking if photos table exists...');
    const { error: checkError } = await supabase
        .from('photos')
        .select('*')
        .limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('   ✗ Photos table does not exist');
        console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:');
        console.log('   Dashboard → SQL Editor → New Query\n');
        console.log('```sql');
        console.log(`-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    state TEXT DEFAULT 'GLOBAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on photos" ON photos
    FOR ALL
    USING (true)
    WITH CHECK (true);
`);
        console.log('```\n');
        return;
    } else if (checkError) {
        console.error('   Error checking table:', checkError);
        return;
    } else {
        console.log('   ✓ Photos table exists');
    }

    // Step 2: Move the PNG from videos to photos
    console.log('\n2. Moving PNG file from videos to photos...');
    const videoId = '40fc019c-e734-4a2d-9a9a-b9a576636bd2';

    // Get the video entry
    const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

    if (fetchError) {
        console.log('   ℹ️  Video not found (may have already been moved)');
    } else if (video) {
        console.log(`   Found: "${video.title}"`);

        // Insert into photos
        const { error: insertError } = await supabase
            .from('photos')
            .insert({
                id: video.id,
                title: video.title,
                photo_url: video.video_url,
                caption: '',
                state: video.state || 'GLOBAL',
                created_at: video.created_at
            });

        if (insertError) {
            if (insertError.code === '23505') {
                console.log('   ℹ️  Photo already exists in photos table');
            } else {
                console.error('   ✗ Error inserting photo:', insertError);
                return;
            }
        } else {
            console.log('   ✓ Inserted into photos table');
        }

        // Delete from videos
        const { error: deleteError } = await supabase
            .from('videos')
            .delete()
            .eq('id', videoId);

        if (deleteError) {
            console.error('   ✗ Error deleting from videos:', deleteError);
        } else {
            console.log('   ✓ Removed from videos table');
        }
    }

    // Step 3: Verify
    console.log('\n3. Verifying photos table...');
    const { data: photos, error: verifyError } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

    if (verifyError) {
        console.error('   ✗ Error fetching photos:', verifyError);
    } else {
        console.log(`   ✓ Found ${photos?.length || 0} photo(s)`);
        if (photos && photos.length > 0) {
            photos.forEach(p => {
                console.log(`      - ${p.title} (${new Date(p.created_at).toLocaleString()})`);
            });
        }
    }

    console.log('\n✅ Setup complete!');
}

setupPhotosTable().catch(console.error);
