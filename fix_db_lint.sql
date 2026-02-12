-- Fix Database Lint Errors

BEGIN;

-- 1. Fix Photos Table RLS Policies (Restrict to authenticated)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.photos;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.photos;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.photos;
DROP POLICY IF EXISTS "Allow public uploads" ON public.photos;
DROP POLICY IF EXISTS "Allow public updates" ON public.photos;
DROP POLICY IF EXISTS "Allow public deletes" ON public.photos;

CREATE POLICY "Allow authenticated insert" ON public.photos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON public.photos
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete" ON public.photos
    FOR DELETE
    TO authenticated
    USING (true);

-- 2. Move pg_net extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 3. Fix Function Search Paths
ALTER FUNCTION public.get_recent_scheduled_job_runs_as_service() SET search_path = public, extensions;
ALTER FUNCTION public.get_recent_scheduled_job_runs_as_service_safe() SET search_path = public, extensions;

-- 4. Fix Security Definer Views (Attempt to convert to Security Invoker)
-- Using DO block to handle potential missing views gracefully if they are system views
DO $$
BEGIN
    ALTER VIEW public.recent_scheduled_job_runs SET (security_invoker = true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter view recent_scheduled_job_runs: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER VIEW public.recent_scheduled_job_runs_old SET (security_invoker = true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter view recent_scheduled_job_runs_old: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER VIEW public.recent_scheduled_job_runs_invoker SET (security_invoker = true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter view recent_scheduled_job_runs_invoker: %', SQLERRM;
END $$;

COMMIT;
