-- Fix Database Lint Errors

BEGIN;

-- 1. Fix Photos Table RLS Policies (Restrict to authenticated, avoiding permissive 'true')
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.photos;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.photos;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.photos;
DROP POLICY IF EXISTS "Allow public uploads" ON public.photos;
DROP POLICY IF EXISTS "Allow public updates" ON public.photos;
DROP POLICY IF EXISTS "Allow public deletes" ON public.photos;

CREATE POLICY "Allow authenticated insert" ON public.photos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update" ON public.photos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated delete" ON public.photos
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- 2. Move pg_net extension to extensions schema (If possible)
DO $$
BEGIN
    CREATE SCHEMA IF NOT EXISTS extensions;
    GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    ALTER EXTENSION pg_net SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not move pg_net extension. It may not support relocation or require superuser: %', SQLERRM;
END $$;

-- 3. Fix Function Search Paths
ALTER FUNCTION public.get_recent_scheduled_job_runs_as_service() SET search_path = public, extensions;
ALTER FUNCTION public.get_recent_scheduled_job_runs_as_service_safe() SET search_path = public, extensions;

-- 4. Fix Security Definer Views (Convert to Security Invoker where possible)
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
