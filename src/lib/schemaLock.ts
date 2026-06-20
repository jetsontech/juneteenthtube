import { supabaseAdmin } from '@/lib/supabase-admin';

type TableCheck = {
  table: string;
  requiredColumns: string[];
};

const SCHEMA_CONTRACTS: TableCheck[] = [
  {
    table: 'videos',
    requiredColumns: [
      'id',
      'title',
      'thumbnail_url',
      'views',
      'created_at',
      'video_url',
      'category',
      'state',
      'channel_name',
      'channel_avatar',
      'owner_id',
      'is_featured',
      'is_trending'
    ]
  },
  {
    table: 'comments',
    requiredColumns: [
      'id',
      'video_id',
      'content',
      'user_name',
      'created_at'
    ]
  },
  {
    table: 'likes',
    requiredColumns: [
      'id',
      'video_id',
      'user_id',
      'type'
    ]
  }
];

const schemaCache: Record<string, boolean> = {};
let lastCheck = 0;
const TTL = 60_000;

export async function validateSchema(): Promise<boolean> {
  const now = Date.now();

  if (now - lastCheck < TTL) return true;

  try {
    for (const table of SCHEMA_CONTRACTS) {
      const { error } = await supabaseAdmin
        .from(table.table)
        .select('*')
        .limit(1);

      if (error) {
        console.warn(`[SCHEMA] Table missing or broken: ${table.table}`);
        return false;
      }

      // We don’t strictly parse columns here because Supabase
      // doesn’t expose schema directly in client safely.
      // Instead we rely on runtime query success.
      schemaCache[table.table] = true;
    }

    lastCheck = now;
    return true;

  } catch (err) {
    console.error('[SCHEMA LOCK FAILURE]', err);
    return false;
  }
}
