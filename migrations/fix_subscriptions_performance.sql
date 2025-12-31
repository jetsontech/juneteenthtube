-- Fix Supabase Performance Issues
-- This script addresses the 6 performance warnings identified in the Supabase Performance Advisor

-- Issue 1 & 2: Auth RLS Initialization Plan
-- Problem: auth.uid() is called for every row, causing performance degradation
-- Solution: Wrap auth.uid() in a subquery so it's evaluated once per query

-- Drop existing policies
DROP POLICY IF EXISTS "Users manage own subs" ON public.subscriptions;
DROP POLICY IF EXISTS "Users view own subs" ON public.subscriptions;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users manage own subs" ON public.subscriptions
    FOR ALL
    USING (guest_id = (SELECT auth.uid()))
    WITH CHECK (guest_id = (SELECT auth.uid()));

CREATE POLICY "Users view own subs" ON public.subscriptions
    FOR SELECT
    USING (guest_id = (SELECT auth.uid()));

-- Issues 3, 4, 5 & 6: Multiple Permissive Policies
-- Problem: Having multiple permissive SELECT policies adds unnecessary overhead
-- Solution: The policies above already cover both SELECT and ALL operations
-- The "Users view own subs" policy is redundant since "Users manage own subs" 
-- already covers SELECT operations with FOR ALL

-- Remove the redundant SELECT-only policy
DROP POLICY IF EXISTS "Users view own subs" ON public.subscriptions;

-- Final optimized policy (single policy for all operations)
DROP POLICY IF EXISTS "Users manage own subs" ON public.subscriptions;

CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
    FOR ALL
    USING (guest_id = (SELECT auth.uid()))
    WITH CHECK (guest_id = (SELECT auth.uid()));

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY policyname;
