-- Syllabus Planning table for teacher/admin to:
-- 1. Select topics per grade/week with checklists
-- 2. Add opening/hook ideas, activity questions, problems
-- 3. Reference calendar events + flipped classroom constraints

CREATE TABLE public.syllabus_planning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 43),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',

    topic TEXT NOT NULL,
    subtopics JSONB DEFAULT '[]',
    syllabus_ref TEXT,

    opening_ideas TEXT,
    activity_questions JSONB DEFAULT '[]',
    problems JSONB DEFAULT '[]',

    calendar_status TEXT DEFAULT 'normal',
    effective_days INT DEFAULT 5,

    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'generated')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year, grade, week_number)
);

ALTER TABLE public.syllabus_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and teacher can manage syllabus" ON public.syllabus_planning
    FOR ALL USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read syllabus" ON public.syllabus_planning
    FOR SELECT USING (public.is_student());

CREATE INDEX idx_syllabus_planning_grade_week ON public.syllabus_planning(grade, week_number);

-- Trigger for updated_at
CREATE TRIGGER update_syllabus_planning_updated_at
    BEFORE UPDATE ON public.syllabus_planning
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Syllabus reference topics (seeded from 08_syllabus.md)
CREATE TABLE public.syllabus_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    unit_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopics JSONB DEFAULT '[]',
    syllabus_ref TEXT,
    curriculum TEXT NOT NULL DEFAULT 'cambridge',
    suggested_weeks INT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade, unit_id)
);

ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read syllabus topics" ON public.syllabus_topics
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify topics" ON public.syllabus_topics
    FOR ALL USING (public.is_admin());
