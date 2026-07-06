-- Multi-subject expansion: subjects table + subject columns on content tables

-- 1. Create subjects table (super_admin managed)
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default subjects
INSERT INTO public.subjects (code, name, icon, sort_order) VALUES
    ('PHY', 'Physics', '⚛️', 1),
    ('MAT', 'Mathematics', '📐', 2),
    ('CHE', 'Chemistry', '🧪', 3),
    ('BIO', 'Biology', '🧬', 4),
    ('ECO', 'Economics', '📊', 5);

-- 2. Add subject column to content tables
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
ALTER TABLE public.weekly_packages ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
ALTER TABLE public.lab_inventory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
ALTER TABLE public.class_memory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);

-- 3. Add owner_id to ai_providers (teacher-owned keys)
ALTER TABLE public.ai_providers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_worksheets_subject ON public.shared_worksheets(subject);
CREATE INDEX IF NOT EXISTS idx_syllabus_planning_subject ON public.syllabus_planning(subject);
CREATE INDEX IF NOT EXISTS idx_packages_subject ON public.weekly_packages(subject);
CREATE INDEX IF NOT EXISTS idx_student_work_subject ON public.student_work(subject);
CREATE INDEX IF NOT EXISTS idx_lab_inventory_subject ON public.lab_inventory(subject);
CREATE INDEX IF NOT EXISTS idx_class_memory_subject ON public.class_memory(subject);
CREATE INDEX IF NOT EXISTS idx_ai_providers_owner ON public.ai_providers(owner_id);

-- 5. RLS: subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read subjects"
    ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Super admin can manage subjects"
    ON public.subjects FOR ALL USING (public.is_admin());
