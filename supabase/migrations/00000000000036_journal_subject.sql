-- Ensure mistake_journals table exists (may not have been created by init migration)
CREATE TABLE IF NOT EXISTS public.mistake_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade INT CHECK (grade BETWEEN 7 AND 12),
    entry_date DATE DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL,
    mistake_description TEXT NOT NULL,
    root_cause TEXT,
    correct_approach TEXT,
    law_or_principle TEXT,
    related_package_id UUID REFERENCES public.weekly_packages(id),
    teacher_feedback TEXT,
    subject TEXT REFERENCES public.subjects(code),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subject column if table already exists without it
ALTER TABLE public.mistake_journals ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journals_student ON public.mistake_journals(student_id);
CREATE INDEX IF NOT EXISTS idx_journals_subject ON public.mistake_journals(subject);

-- Enable RLS if not already
ALTER TABLE public.mistake_journals ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent)
DROP POLICY IF EXISTS "Students can CRUD own journals" ON public.mistake_journals;
CREATE POLICY "Students can CRUD own journals" ON public.mistake_journals
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can update journals" ON public.mistake_journals;
CREATE POLICY "Teachers can update journals" ON public.mistake_journals
    FOR UPDATE USING (public.is_admin_or_teacher());

DROP POLICY IF EXISTS "Admins can read all journals" ON public.mistake_journals;
CREATE POLICY "Admins can read all journals" ON public.mistake_journals
    FOR SELECT USING (public.is_admin_or_teacher());

-- Trigger (idempotent)
DROP TRIGGER IF EXISTS update_journals_updated_at ON public.mistake_journals;
CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON public.mistake_journals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
