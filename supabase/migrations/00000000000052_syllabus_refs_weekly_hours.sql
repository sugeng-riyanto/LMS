CREATE TABLE IF NOT EXISTS public.syllabus_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    ref TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_code, grade)
);

ALTER TABLE public.syllabus_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read syllabus_refs" ON public.syllabus_refs FOR SELECT USING (true);
CREATE POLICY "Admin can manage syllabus_refs" ON public.syllabus_refs FOR ALL USING (public.is_admin_or_teacher());

CREATE TABLE IF NOT EXISTS public.weekly_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT NOT NULL REFERENCES public.subjects(code) ON DELETE CASCADE,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    hours INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_code, grade)
);

ALTER TABLE public.weekly_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weekly_hours" ON public.weekly_hours FOR SELECT USING (true);
CREATE POLICY "Admin can manage weekly_hours" ON public.weekly_hours FOR ALL USING (public.is_admin_or_teacher());

-- Seed default syllabus_refs
INSERT INTO public.syllabus_refs (subject_code, grade, ref) VALUES
    ('PHY', 7, '0893 Stage 7'), ('PHY', 8, '0893 Stage 8/9'), ('PHY', 9, '0625 (Half)'),
    ('PHY', 10, '0625 (Full)'), ('PHY', 11, '9702 AS'), ('PHY', 12, '9702 A2 + TKA'),
    ('MAT', 7, '0893 Stage 7'), ('MAT', 8, '0893 Stage 8/9'), ('MAT', 9, '0625 (Half)'),
    ('MAT', 10, '0923 IGCSE'), ('MAT', 11, '9709 AS'), ('MAT', 12, '9709 A2'),
    ('CHE', 7, '0893 Stage 7'), ('CHE', 8, '0893 Stage 8/9'), ('CHE', 9, '0625 (Half)'),
    ('CHE', 10, '0620 IGCSE'), ('CHE', 11, '9701 AS'), ('CHE', 12, '9701 A2'),
    ('BIO', 7, '0893 Stage 7'), ('BIO', 8, '0893 Stage 8/9'), ('BIO', 9, '0625 (Half)'),
    ('BIO', 10, '0610 IGCSE'), ('BIO', 11, '9700 AS'), ('BIO', 12, '9700 A2'),
    ('ECO', 7, '0893 Stage 7'), ('ECO', 8, '0893 Stage 8/9'), ('ECO', 9, '0625 (Half)'),
    ('ECO', 10, '0455 IGCSE'), ('ECO', 11, '9708 AS'), ('ECO', 12, '9708 A2')
ON CONFLICT (subject_code, grade) DO NOTHING;

-- Seed default weekly_hours (JHS=3h, SHS=4h for all subjects)
INSERT INTO public.weekly_hours (subject_code, grade, hours)
SELECT s.code, g.value, CASE WHEN g.value <= 10 THEN 3 ELSE 4 END
FROM public.subjects s
CROSS JOIN (VALUES (7),(8),(9),(10),(11),(12)) AS g(value)
ON CONFLICT (subject_code, grade) DO NOTHING;
