-- Principal role for JHS (Grades 7-9) and SHS (Grades 10-12) oversight

-- 1. Extend app_role enum (PG 14+ supports IF NOT EXISTS)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';

-- 2. Principal assignments table
CREATE TABLE IF NOT EXISTS public.principal_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('JHS', 'SHS')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(principal_id)
);

ALTER TABLE public.principal_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read principal assignments" ON public.principal_assignments;
CREATE POLICY "Everyone can read principal assignments"
    ON public.principal_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only super_admin can manage principal assignments" ON public.principal_assignments;
CREATE POLICY "Only super_admin can manage principal assignments"
    ON public.principal_assignments FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_principal_assignments_principal ON public.principal_assignments(principal_id);

-- 3. Add is_admin_or_principal helper for SELECT policies
CREATE OR REPLACE FUNCTION public.is_admin_or_principal()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'principal'))
$$;
