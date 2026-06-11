import { createClient } from "@supabase/supabase-js";

export const createServerSupabase = (useServiceRole = false) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !key) {
    throw new Error("❌ Structural Build Crash: Server-Side Supabase client invoked without valid environment configuration.");
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false, // Mandated protocol within React Server Component context loop
    },
  });
};
