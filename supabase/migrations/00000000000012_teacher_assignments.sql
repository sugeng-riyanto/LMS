-- Teacher assignments: which teachers teach which grades and subjects

CREATE TABLE public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    subject TEXT NOT NULL DEFAULT 'Physics',
    UNIQUE(teacher_id, grade, subject)
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read teacher assignments"
    ON public.teacher_assignments FOR SELECT
    USING (true);

CREATE POLICY "Only super_admin can manage teacher assignments"
    ON public.teacher_assignments FOR ALL
    USING (public.is_admin());

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_grade ON public.teacher_assignments(grade);
