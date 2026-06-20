import { supabaseAdmin } from '@/lib/supabase-admin';

export async function checkSchema() {
  try {
    const { error } = await supabaseAdmin
      .from('videos')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[SCHEMA GUARD] DB error:', error.message);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[SCHEMA GUARD] Fatal schema failure:', e);
    return false;
  }
}
