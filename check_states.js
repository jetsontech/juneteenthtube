require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('videos').select('id, title, state, category, is_featured, is_trending');
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Videos with 'published' state:");
  data.filter(v => v.state === 'published').forEach(v => {
    console.log(`- ID: ${v.id} | Title: "${v.title}" | Category: ${v.category}`);
  });

  console.log("\nVideos with 'active' state:");
  data.filter(v => v.state === 'active').forEach(v => {
    console.log(`- ID: ${v.id} | Title: "${v.title}" | Category: ${v.category}`);
  });

  console.log("\nVideos with 'TX' state:");
  data.filter(v => v.state === 'TX').forEach(v => {
    console.log(`- ID: ${v.id} | Title: "${v.title}" | Category: ${v.category}`);
  });
  
  process.exit(0);
}

check();
