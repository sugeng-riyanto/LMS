-- Principal-to-teacher direct mapping table
-- Allows super admin to explicitly assign which teachers each principal supervises

CREATE TABLE IF NOT EXISTS public.principal_teacher_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(principal_id, teacher_id)
);

ALTER TABLE public.principal_teacher_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Anyone can read mappings"
    ON public.principal_teacher_mappings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Super admin can manage mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Super admin can manage mappings"
    ON public.principal_teacher_mappings FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_ptm_principal ON public.principal_teacher_mappings(principal_id);
CREATE INDEX IF NOT EXISTS idx_ptm_teacher ON public.principal_teacher_mappings(teacher_id);
