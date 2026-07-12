-- Create subjects table (database-driven, replaces hardcoded list)
CREATE TABLE IF NOT EXISTS public.subjects (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📘',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Everyone can read subjects
CREATE POLICY "Anyone can read subjects" ON public.subjects
    FOR SELECT USING (true);

-- Only super_admin can modify subjects
CREATE POLICY "Admin can manage subjects" ON public.subjects
    FOR ALL USING (public.is_admin_or_teacher());

-- Seed default subjects
INSERT INTO public.subjects (code, name, icon, sort_order) VALUES
    ('PHY', 'Physics', '⚛️', 1),
    ('MAT', 'Mathematics', '📐', 2),
    ('CHE', 'Chemistry', '🧪', 3),
    ('BIO', 'Biology', '🧬', 4),
    ('ECO', 'Economics', '📊', 5),
    ('IND', 'Indonesian', '🇮🇩', 6),
    ('ENG', 'English', '📖', 7),
    ('PKN', 'PKN', '🏛️', 8),
    ('HIS', 'History', '📜', 9),
    ('GEO', 'Geography', '🌍', 10),
    ('ART', 'Art & Culture', '🎨', 11),
    ('REL', 'Religion', '🕋', 12),
    ('PE', 'Physical Education', '⚽', 13)
ON CONFLICT (code) DO NOTHING;

-- Create assessment_weights table (per-grade category weights)
CREATE TABLE IF NOT EXISTS public.assessment_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    category TEXT NOT NULL CHECK (category IN ('classwork', 'unit_test', 'project', 'homework', 'mid_semester', 'final_semester')),
    weight DECIMAL(4,3) NOT NULL DEFAULT 0.100,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id),
    UNIQUE(grade, category)
);

ALTER TABLE public.assessment_weights ENABLE ROW LEVEL SECURITY;

-- Everyone can read weights
CREATE POLICY "Anyone can read assessment weights" ON public.assessment_weights
    FOR SELECT USING (true);

-- Only super_admin and principal can modify weights
CREATE POLICY "Admin and principal can manage assessment weights" ON public.assessment_weights
    FOR ALL USING (public.is_admin_or_teacher());

-- Seed default weights for all grades 7-12
INSERT INTO public.assessment_weights (grade, category, weight)
SELECT g, c, w FROM (
    VALUES ('classwork'::text, 0.400),
           ('unit_test'::text, 0.200),
           ('project'::text, 0.100),
           ('homework'::text, 0.100),
           ('mid_semester'::text, 0.100),
           ('final_semester'::text, 0.100)
) AS cats(c, w)
CROSS JOIN generate_series(7, 12) AS g
ON CONFLICT (grade, category) DO NOTHING;
