-- Supervision system for principal → teacher observations

CREATE TABLE IF NOT EXISTS public.supervisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES public.profiles(id),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    subject TEXT NOT NULL,
    class_name TEXT,
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'acknowledged')),

    -- Scores
    teaching_quality_score INT CHECK (teaching_quality_score BETWEEN 1 AND 5),
    classroom_management_score INT CHECK (classroom_management_score BETWEEN 1 AND 5),
    student_engagement_score INT CHECK (student_engagement_score BETWEEN 1 AND 5),

    -- Feedback
    notes TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,

    -- Signatures
    principal_signature TEXT,
    teacher_signature TEXT,
    principal_signed_at TIMESTAMPTZ,
    teacher_signed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;

-- Principals see their own; teachers see theirs; super_admin sees all
CREATE POLICY "Principals can manage own supervisions"
    ON public.supervisions FOR ALL
    USING (auth.uid() = principal_id OR public.is_admin());

CREATE POLICY "Teachers can read own supervisions"
    ON public.supervisions FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own signature"
    ON public.supervisions FOR UPDATE
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id AND status = 'published');

CREATE INDEX IF NOT EXISTS idx_supervisions_principal ON public.supervisions(principal_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_teacher ON public.supervisions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_status ON public.supervisions(status);

CREATE TRIGGER update_supervisions_updated_at
    BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
