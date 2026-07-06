-- TPA enhancement: accumulation, class-level, scoping

-- Add class_name to TPA for parallel class tracking
ALTER TABLE public.teacher_performance_assessments
  ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Accumulation table: running totals per teacher per academic year
CREATE TABLE IF NOT EXISTS public.tpa_accumulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester_1_score DECIMAL,
    semester_1_grade TEXT,
    semester_2_score DECIMAL,
    semester_2_grade TEXT,
    annual_average DECIMAL,
    annual_grade TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, academic_year)
);

ALTER TABLE public.tpa_accumulations ENABLE ROW LEVEL security;

CREATE POLICY "Principals read accumulations"
    ON public.tpa_accumulations FOR SELECT
    USING (public.is_admin_or_principal() OR auth.uid() = teacher_id);

CREATE POLICY "Super admin manage accumulations"
    ON public.tpa_accumulations FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_tpa_acc_teacher ON public.tpa_accumulations(teacher_id);

-- Allow principals to read teacher assignments (level scoping depends on this)
-- Already enabled via existing RLS
