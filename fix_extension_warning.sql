-- OPTIONAL: Try to fix the 'extension_in_public' warning by reinstalling pg_net in the 'extensions' schema.
-- WARNING: This will remove any existing net.http_* configuration/history if you were using it.
-- If you are not using database webhooks/functions, this is safe.

BEGIN;

-- 1. Create the extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. Drop the extension from public (if it exists there)
DROP EXTENSION IF EXISTS pg_net;

-- 3. Re-install the extension in the 'extensions' schema
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

COMMIT;

-- Note on 'auth_leaked_password_protection':
-- This warning requires enabling "Leaked Password Protection" in the Supabase Dashboard:
-- Authentication > Security > Advanced Security Features
-- This is a paid feature (Pro plan). If you are on the Free plan, you can ignore this warning.
