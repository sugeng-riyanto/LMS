-- Teacher Performance Assessment (TPA) System
-- Based on SHB rubric: 6 categories, weighted scoring, dual evaluator

CREATE TABLE IF NOT EXISTS public.teacher_performance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
    principal_id UUID NOT NULL REFERENCES public.profiles(id),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    subject TEXT,
    grade INT CHECK (grade BETWEEN 7 AND 12),

    -- Principal's scores (stored as JSONB matching rubric structure)
    principal_scores JSONB,
    principal_total DECIMAL,
    principal_submitted_at TIMESTAMPTZ,

    -- Teacher's self-assessment scores
    teacher_scores JSONB,
    teacher_total DECIMAL,
    teacher_submitted_at TIMESTAMPTZ,

    -- Combined final score
    combined_total DECIMAL,
    combined_grade TEXT,

    -- Status workflow
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'principal_submitted', 'teacher_submitted', 'completed')),

    -- Signatures
    principal_signature TEXT,
    teacher_signature TEXT,
    principal_signed_at TIMESTAMPTZ,
    teacher_signed_at TIMESTAMPTZ,

    -- Conference tracking
    pre_appraisal_held BOOLEAN DEFAULT false,
    post_conference_held BOOLEAN DEFAULT false,
    visit_count INT DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teacher_performance_assessments ENABLE ROW LEVEL SECURITY;

-- Principals manage their own assessments
CREATE POLICY "Principals manage own TPA"
    ON public.teacher_performance_assessments FOR ALL
    USING (auth.uid() = principal_id OR public.is_admin());

-- Teachers read their own
CREATE POLICY "Teachers read own TPA"
    ON public.teacher_performance_assessments FOR SELECT
    USING (auth.uid() = teacher_id);

-- Teachers update their own scores
CREATE POLICY "Teachers submit own TPA scores"
    ON public.teacher_performance_assessments FOR UPDATE
    USING (auth.uid() = teacher_id AND status = 'principal_submitted')
    WITH CHECK (auth.uid() = teacher_id AND status = 'principal_submitted');

CREATE INDEX IF NOT EXISTS idx_tpa_teacher ON public.teacher_performance_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tpa_principal ON public.teacher_performance_assessments(principal_id);
CREATE INDEX IF NOT EXISTS idx_tpa_semester ON public.teacher_performance_assessments(academic_year, semester);

CREATE TRIGGER update_tpa_updated_at
    BEFORE UPDATE ON public.teacher_performance_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
