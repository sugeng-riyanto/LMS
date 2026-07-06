-- ============================================================
-- CATCH-UP: Creates ALL remaining tables that may be missing
-- PREREQUISITE: Run 00000000000000a_functions.sql first
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- 1. SUBJECTS (mig 00033)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📚',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
INSERT INTO public.subjects (code, name, icon, sort_order) VALUES
    ('PHY', 'Physics', '⚛️', 1),
    ('MAT', 'Mathematics', '📐', 2),
    ('CHE', 'Chemistry', '🧪', 3),
    ('BIO', 'Biology', '🧬', 4),
    ('ECO', 'Economics', '📊', 5)
ON CONFLICT (code) DO NOTHING;
DROP POLICY IF EXISTS "Everyone can read subjects" ON public.subjects;
CREATE POLICY "Everyone can read subjects" ON public.subjects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage subjects" ON public.subjects;
CREATE POLICY "Super admin can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());

-- 2. CLASSES (mig 00034)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade >= 7 AND grade <= 12),
  class_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Classes are viewable by all authenticated" ON public.classes;
CREATE POLICY "Classes are viewable by all authenticated" ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Classes are manageable by super_admin" ON public.classes;
CREATE POLICY "Classes are manageable by super_admin" ON public.classes FOR ALL TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');
INSERT INTO public.classes (grade, class_name) VALUES
  (7, 'A'), (7, 'B'), (7, 'C'),
  (8, 'A'), (8, 'B'), (8, 'C'),
  (9, 'A'), (9, 'B'), (9, 'C'),
  (10, 'A'), (10, 'B'), (10, 'C'),
  (11, 'A'), (11, 'B'), (11, 'C'),
  (12, 'A'), (12, 'B'), (12, 'C')
ON CONFLICT DO NOTHING;

-- 3. TEACHER ASSIGNMENTS (mig 00012 + 00035)
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    subject TEXT NOT NULL DEFAULT 'Physics',
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    UNIQUE(teacher_id, grade, subject)
);
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read teacher assignments" ON public.teacher_assignments;
CREATE POLICY "Everyone can read teacher assignments" ON public.teacher_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only super_admin can manage teacher assignments" ON public.teacher_assignments;
CREATE POLICY "Only super_admin can manage teacher assignments" ON public.teacher_assignments FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON public.teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_grade ON public.teacher_assignments(grade);

-- 4. STUDENT MISTAKE JOURNALS (init + mig 00036)
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
    related_package_id UUID, -- FK skipped: weekly_packages table may not exist
    teacher_feedback TEXT,
    subject TEXT REFERENCES public.subjects(code),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.mistake_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can CRUD own journals" ON public.mistake_journals;
CREATE POLICY "Students can CRUD own journals" ON public.mistake_journals FOR ALL USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Teachers can update journals" ON public.mistake_journals;
CREATE POLICY "Teachers can update journals" ON public.mistake_journals FOR UPDATE USING (public.is_admin_or_teacher());
DROP POLICY IF EXISTS "Admins can read all journals" ON public.mistake_journals;
CREATE POLICY "Admins can read all journals" ON public.mistake_journals FOR SELECT USING (public.is_admin_or_teacher());
CREATE INDEX IF NOT EXISTS idx_journals_student ON public.mistake_journals(student_id);
CREATE INDEX IF NOT EXISTS idx_journals_subject ON public.mistake_journals(subject);

-- 5. DOWNLOAD LOGS (mig 00034)
CREATE TABLE IF NOT EXISTS public.download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  download_type TEXT NOT NULL,
  ip_address TEXT,
  geolocation TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Download logs viewable by super_admin" ON public.download_logs;
CREATE POLICY "Download logs viewable by super_admin" ON public.download_logs FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');
DROP POLICY IF EXISTS "Download logs insertable by authenticated" ON public.download_logs;
CREATE POLICY "Download logs insertable by authenticated" ON public.download_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- ALTER TABLE statements (safe, idempotent)
-- Each checks if the table exists first
-- ============================================================

DO $$ 
DECLARE
  tbl_exists boolean;
BEGIN
  -- SUBJECT columns on content tables (mig 00033)
  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shared_worksheets') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS score_category TEXT;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS objectives TEXT;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS reference_pdf_url TEXT;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS theory_video_url TEXT;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS theory_video_title TEXT;
    ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS page_images TEXT[] DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_worksheets_subject ON public.shared_worksheets(subject);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'syllabus_planning') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
    ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS score_category TEXT CHECK (score_category IN ('classwork', 'unit_test', 'project', 'homework', 'mid_semester', 'final_semester'));
    ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
    ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
    CREATE INDEX IF NOT EXISTS idx_syllabus_planning_subject ON public.syllabus_planning(subject);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'weekly_packages') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.weekly_packages ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
    CREATE INDEX IF NOT EXISTS idx_packages_subject ON public.weekly_packages(subject);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_work') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
    ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
    ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS syllabus_id UUID REFERENCES public.syllabus_planning(id) ON DELETE SET NULL;
    ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS worksheet_id UUID REFERENCES public.shared_worksheets(id) ON DELETE SET NULL;
    ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS teacher_annotation TEXT;
    CREATE INDEX IF NOT EXISTS idx_student_work_subject ON public.student_work(subject);
    CREATE INDEX IF NOT EXISTS idx_student_work_syllabus ON public.student_work(syllabus_id);
    CREATE INDEX IF NOT EXISTS idx_student_work_worksheet ON public.student_work(worksheet_id);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_inventory') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.lab_inventory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
    CREATE INDEX IF NOT EXISTS idx_lab_inventory_subject ON public.lab_inventory(subject);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'class_memory') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.class_memory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
    CREATE INDEX IF NOT EXISTS idx_class_memory_subject ON public.class_memory(subject);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_providers') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.ai_providers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
    CREATE INDEX IF NOT EXISTS idx_ai_providers_owner ON public.ai_providers(owner_id);
  END IF;

  SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'syllabus_documents') INTO tbl_exists;
  IF tbl_exists THEN
    ALTER TABLE public.syllabus_documents ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
    ALTER TABLE public.syllabus_documents ADD COLUMN IF NOT EXISTS score_category TEXT;
  END IF;
END $$;

-- Student notifications table (mig 00027)
CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'grade_published', 'feedback', 'announcement')),
    read BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students read own notifications" ON public.student_notifications;
CREATE POLICY "Students read own notifications" ON public.student_notifications FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Students update own notifications (read)" ON public.student_notifications;
CREATE POLICY "Students update own notifications (read)" ON public.student_notifications FOR UPDATE USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Teachers insert notifications" ON public.student_notifications;
CREATE POLICY "Teachers insert notifications" ON public.student_notifications FOR INSERT WITH CHECK (public.is_admin_or_teacher());
DROP POLICY IF EXISTS "Teachers read notifications" ON public.student_notifications;
CREATE POLICY "Teachers read notifications" ON public.student_notifications FOR SELECT USING (public.is_admin_or_teacher());
CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.student_notifications(read);

-- Storage bucket for worksheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('worksheets', 'worksheets', true)
ON CONFLICT (id) DO NOTHING;
