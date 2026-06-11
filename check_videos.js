require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('videos').select('id, title, thumbnail_url, video_url').then(res => {
  if (res.error) {
    console.error("Error:", res.error);
    process.exit(1);
  }
  
  const missing = res.data.filter(v => !v.thumbnail_url || v.thumbnail_url.trim() === "");
  console.log(`Total videos: ${res.data.length}`);
  console.log(`Videos missing cover art: ${missing.length}`);
  
  missing.forEach((v, i) => {
    console.log(`[${i+1}] ID: ${v.id} | Title: "${v.title}" | Video: "${v.video_url}"`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
