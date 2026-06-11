import { createClient } from '@supabase/supabase-js';
const sanitizeEnv = (val: string | undefined) => val ? val.replace(/^['"]+|['"]+$/g, '').trim().replace(/[\n\r]/g, '') : undefined;

const supabaseUrl = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://example.com";
const supabaseKey = sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseKey);
