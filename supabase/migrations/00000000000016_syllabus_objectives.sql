-- Learning objectives per grade sourced from Cambridge syllabus documents
CREATE TABLE public.syllabus_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    unit_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    objectives TEXT[] NOT NULL DEFAULT '{}',
    syllabus_ref TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade, unit_id)
);

ALTER TABLE public.syllabus_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read syllabus objectives"
    ON public.syllabus_objectives FOR SELECT USING (true);
CREATE POLICY "Only super_admin can modify objectives"
    ON public.syllabus_objectives FOR ALL USING (public.is_admin());
