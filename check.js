require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('likes').select('*').limit(1).then(data => {
  console.log(data);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
