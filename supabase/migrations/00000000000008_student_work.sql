-- Student work submissions with anti-cheat, canvas drawing, grading, and feedback

CREATE TABLE public.student_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.weekly_packages(id) ON DELETE SET NULL,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL DEFAULT '',
    question_type TEXT NOT NULL DEFAULT 'paragraph' CHECK (question_type IN ('paragraph', 'canvas', 'multiple_choice')),
    answer_text TEXT,
    canvas_data JSONB DEFAULT NULL,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2) DEFAULT 10,
    feedback TEXT,
    teacher_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_work ENABLE ROW LEVEL SECURITY;

-- Students can CRUD their own work
CREATE POLICY "Students manage own work"
    ON public.student_work FOR ALL
    USING (auth.uid() = student_id);

-- Teachers and admins can read all work
CREATE POLICY "Teachers read all work"
    ON public.student_work FOR SELECT
    USING (public.is_admin_or_teacher());

-- Teachers can update grading fields
CREATE POLICY "Teachers grade work"
    ON public.student_work FOR UPDATE
    USING (public.is_admin_or_teacher())
    WITH CHECK (public.is_admin_or_teacher());

CREATE INDEX idx_student_work_student ON public.student_work(student_id);
CREATE INDEX idx_student_work_package ON public.student_work(package_id);
CREATE INDEX idx_student_work_status ON public.student_work(status);

CREATE TRIGGER update_student_work_updated_at
    BEFORE UPDATE ON public.student_work
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
