-- Fix AI providers RLS: ensure teachers and principals can manage their own providers

-- First ensure the helper function includes principal
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher', 'principal'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop all existing policies on ai_providers
DROP POLICY IF EXISTS "Only super_admin can manage AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers can read active AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Super admin can manage all AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can read all providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can insert own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can update own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can delete own providers" ON public.ai_providers;

-- Create clean policies
CREATE POLICY "Super admin can manage all AI providers"
    ON public.ai_providers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Teachers and principals can read all providers"
    ON public.ai_providers FOR SELECT
    USING (true);

CREATE POLICY "Teachers and principals can insert own providers"
    ON public.ai_providers FOR INSERT
    WITH CHECK (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can update own providers"
    ON public.ai_providers FOR UPDATE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can delete own providers"
    ON public.ai_providers FOR DELETE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());
