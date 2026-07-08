-- ============================================================
-- FIX ALL RBAC + MISSING TABLES — RUN IN SUPABASE SQL EDITOR
-- Idempotent: safe to run multiple times
-- ============================================================

-- ============================================================
-- 1. ENSURE principal ROLE IN APP_ROLE ENUM
-- ============================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';

-- ============================================================
-- 2. RECREATE ALL HELPER FUNCTIONS (include principal everywhere)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher', 'principal'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_principal()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'principal'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_lab()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'lab_assistant'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_grade()
RETURNS INT LANGUAGE plpgsql STABLE SECURITY DEFINER AS $f$
BEGIN
  RETURN (SELECT grade_assigned FROM public.profiles WHERE id = auth.uid());
END;
$f$;

-- Trigger function for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. CREATE MISSING TABLES (IF NOT EXISTS)
-- ============================================================

-- 3a. principal_assignments (from mig 00038)
CREATE TABLE IF NOT EXISTS public.principal_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('JHS', 'SHS')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(principal_id)
);

ALTER TABLE public.principal_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read principal assignments" ON public.principal_assignments;
CREATE POLICY "Everyone can read principal assignments"
    ON public.principal_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only super_admin can manage principal assignments" ON public.principal_assignments;
CREATE POLICY "Only super_admin can manage principal assignments"
    ON public.principal_assignments FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_principal_assignments_principal ON public.principal_assignments(principal_id);

-- 3b. principal_teacher_mappings (from duplicated mig 00047)
CREATE TABLE IF NOT EXISTS public.principal_teacher_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(principal_id, teacher_id)
);

ALTER TABLE public.principal_teacher_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Anyone can read mappings"
    ON public.principal_teacher_mappings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Super admin can manage mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Super admin can manage mappings"
    ON public.principal_teacher_mappings FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_ptm_principal ON public.principal_teacher_mappings(principal_id);
CREATE INDEX IF NOT EXISTS idx_ptm_teacher ON public.principal_teacher_mappings(teacher_id);

-- 3c. Ensure subjects table exists with all 5 subjects
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

-- 3d. classes table
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
CREATE POLICY "Classes are manageable by super_admin" ON public.classes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.classes (grade, class_name) VALUES
  (7, 'A'), (7, 'B'), (7, 'C'),
  (8, 'A'), (8, 'B'), (8, 'C'),
  (9, 'A'), (9, 'B'), (9, 'C'),
  (10, 'A'), (10, 'B'), (10, 'C'),
  (11, 'A'), (11, 'B'), (11, 'C'),
  (12, 'A'), (12, 'B'), (12, 'C')
ON CONFLICT DO NOTHING;

-- 3e. role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'teacher', 'lab_assistant', 'student', 'principal')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(route, role)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admin can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Super admin can manage role_permissions" ON public.role_permissions FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_role_permissions_route ON public.role_permissions(route);

-- Seed role_permissions (idempotent)
INSERT INTO public.role_permissions (route, role) VALUES
  ('/grades', 'super_admin'), ('/grades', 'teacher'),
  ('/generate', 'super_admin'), ('/generate', 'teacher'),
  ('/grading', 'super_admin'), ('/grading', 'teacher'),
  ('/profile', 'super_admin'), ('/profile', 'teacher'), ('/profile', 'lab_assistant'), ('/profile', 'student'), ('/profile', 'principal'),
  ('/help', 'super_admin'), ('/help', 'teacher'), ('/help', 'lab_assistant'), ('/help', 'student'), ('/help', 'principal'),
  ('/lesson-plan', 'super_admin'), ('/lesson-plan', 'teacher'),
  ('/memory', 'super_admin'), ('/memory', 'teacher'),
  ('/analytics', 'super_admin'), ('/analytics', 'teacher'), ('/analytics', 'principal'),
  ('/journals', 'super_admin'), ('/journals', 'teacher'),
  ('/settings', 'super_admin'), ('/settings', 'teacher'), ('/settings', 'principal'),
  ('/lab', 'super_admin'), ('/lab', 'lab_assistant'),
  ('/syllabus', 'super_admin'), ('/syllabus', 'teacher'), ('/syllabus', 'student'), ('/syllabus', 'principal'),
  ('/syllabus-manager', 'super_admin'), ('/syllabus-manager', 'teacher'),
  ('/worksheets', 'super_admin'), ('/worksheets', 'teacher'), ('/worksheets', 'student'),
  ('/calendar', 'super_admin'), ('/calendar', 'teacher'), ('/calendar', 'lab_assistant'), ('/calendar', 'student'), ('/calendar', 'principal'),
  ('/my-week', 'student'),
  ('/my-work', 'student'),
  ('/my-progress', 'student'),
  ('/my-journal', 'student'),
  ('/pre-class', 'student'),
  ('/principal', 'principal'),
  ('/supervisions', 'super_admin'), ('/supervisions', 'principal'), ('/supervisions', 'teacher'),
  ('/tpa', 'super_admin'), ('/tpa', 'principal'), ('/tpa', 'teacher')
ON CONFLICT (route, role) DO NOTHING;

-- ============================================================
-- 4. FIX RLS POLICIES ON ALL EXISTING TABLES
-- ============================================================

-- --------------------------------------------------
-- 4a. PROFILES
-- --------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and principals can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers and admin can view all profiles" ON public.profiles;

CREATE POLICY "Super admin can read all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Teachers can read all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin_or_teacher());

CREATE POLICY "Principals can read all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin_or_principal());

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Super admin can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Super admin can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admin can delete profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin());

-- --------------------------------------------------
-- 4b. WEEKLY_PACKAGES
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage packages" ON public.weekly_packages;
DROP POLICY IF EXISTS "Published packages viewable by all" ON public.weekly_packages;
DROP POLICY IF EXISTS "Packages viewable by all" ON public.weekly_packages;
DROP POLICY IF EXISTS "Super admin can manage packages" ON public.weekly_packages;
DROP POLICY IF EXISTS "Authenticated users can read packages" ON public.weekly_packages;
DROP POLICY IF EXISTS "Teachers and admin can manage packages" ON public.weekly_packages;

DROP POLICY IF EXISTS "Teachers and admin can update packages" ON public.weekly_packages;

CREATE POLICY "Super admin and teachers can manage weekly_packages"
    ON public.weekly_packages FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read published packages"
    ON public.weekly_packages FOR SELECT
    USING (public.is_student() AND status = 'published');

CREATE POLICY "Lab assistants can read packages"
    ON public.weekly_packages FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'lab_assistant');

CREATE POLICY "Principals can read packages"
    ON public.weekly_packages FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'principal');

-- --------------------------------------------------
-- 4c. SYLLABUS_PLANNING
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage syllabus planning" ON public.syllabus_planning;
DROP POLICY IF EXISTS "Students can read published syllabus" ON public.syllabus_planning;
DROP POLICY IF EXISTS "Super admin and teachers can manage syllabus" ON public.syllabus_planning;

CREATE POLICY "Super admin and teachers can manage syllabus_planning"
    ON public.syllabus_planning FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read published syllabus_planning"
    ON public.syllabus_planning FOR SELECT
    USING (public.is_student() AND published = true);

CREATE POLICY "Principals can read syllabus_planning"
    ON public.syllabus_planning FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'principal');

-- --------------------------------------------------
-- 4d. SYLLABUS_TOPICS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Only super_admin can modify topics" ON public.syllabus_topics;
DROP POLICY IF EXISTS "Admin and teacher can modify topics" ON public.syllabus_topics;
DROP POLICY IF EXISTS "Super admin and teachers can manage topics" ON public.syllabus_topics;

CREATE POLICY "Super admin and teachers can manage syllabus_topics"
    ON public.syllabus_topics FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Everyone can read syllabus_topics"
    ON public.syllabus_topics FOR SELECT
    USING (true);

-- --------------------------------------------------
-- 4e. SYLLABUS_DOCUMENTS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage syllabus documents" ON public.syllabus_documents;
DROP POLICY IF EXISTS "Students can read published syllabus docs" ON public.syllabus_documents;
DROP POLICY IF EXISTS "Super admin and teachers can manage syllabus docs" ON public.syllabus_documents;

CREATE POLICY "Super admin and teachers can manage syllabus_documents"
    ON public.syllabus_documents FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read published syllabus_documents"
    ON public.syllabus_documents FOR SELECT
    USING (public.is_student() AND published = true);

CREATE POLICY "Principals can read syllabus_documents"
    ON public.syllabus_documents FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'principal');

-- --------------------------------------------------
-- 4f. SHARED_WORKSHEETS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage worksheets" ON public.shared_worksheets;
DROP POLICY IF EXISTS "Students can read published worksheets" ON public.shared_worksheets;
DROP POLICY IF EXISTS "Super admin and teachers can manage worksheets" ON public.shared_worksheets;
DROP POLICY IF EXISTS "Everyone can read worksheets" ON public.shared_worksheets;

CREATE POLICY "Super admin and teachers can manage shared_worksheets"
    ON public.shared_worksheets FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read published shared_worksheets"
    ON public.shared_worksheets FOR SELECT
    USING (public.is_student() AND published = true);

CREATE POLICY "Principals can read shared_worksheets"
    ON public.shared_worksheets FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'principal');

-- --------------------------------------------------
-- 4g. STUDENT_WORK
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read student work" ON public.student_work;
DROP POLICY IF EXISTS "Students can read own work" ON public.student_work;
DROP POLICY IF EXISTS "Super admin can read all student work" ON public.student_work;
DROP POLICY IF EXISTS "Teachers can update student work" ON public.student_work;

CREATE POLICY "Super admin and teachers can manage student_work"
    ON public.student_work FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read own student_work"
    ON public.student_work FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own student_work"
    ON public.student_work FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Principals can read student_work"
    ON public.student_work FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'principal');

-- --------------------------------------------------
-- 4h. STUDENT_NOTIFICATIONS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Students read own notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students update own notifications (read)" ON public.student_notifications;
DROP POLICY IF EXISTS "Teachers insert notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Teachers read notifications" ON public.student_notifications;

CREATE POLICY "Super admin and teachers can manage student_notifications"
    ON public.student_notifications FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students read own student_notifications"
    ON public.student_notifications FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students update own student_notifications (read)"
    ON public.student_notifications FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students insert own student_notifications"
    ON public.student_notifications FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- --------------------------------------------------
-- 4i. TEACHER_ASSIGNMENTS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Everyone can read teacher assignments" ON public.teacher_assignments;
DROP POLICY IF EXISTS "Only super_admin can manage teacher assignments" ON public.teacher_assignments;

CREATE POLICY "Super admin can manage teacher_assignments"
    ON public.teacher_assignments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Teachers can read teacher_assignments"
    ON public.teacher_assignments FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'principal'));

CREATE POLICY "Everyone can read teacher_assignments"
    ON public.teacher_assignments FOR SELECT
    USING (true);

-- --------------------------------------------------
-- 4j. AI_PROVIDERS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Super admin can manage all AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can read all providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can insert own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can update own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can delete own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Only super_admin can manage AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers can read active AI providers" ON public.ai_providers;

CREATE POLICY "Super admin can manage all ai_providers"
    ON public.ai_providers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Teachers and principals can read all ai_providers"
    ON public.ai_providers FOR SELECT
    USING (true);

CREATE POLICY "Teachers and principals can insert own ai_providers"
    ON public.ai_providers FOR INSERT
    WITH CHECK (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can update own ai_providers"
    ON public.ai_providers FOR UPDATE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can delete own ai_providers"
    ON public.ai_providers FOR DELETE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());

-- --------------------------------------------------
-- 4k. SCHOOL_SETTINGS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read school_settings" ON public.school_settings;
DROP POLICY IF EXISTS "Super admin can update school_settings" ON public.school_settings;

CREATE POLICY "Super admin can manage school_settings"
    ON public.school_settings FOR ALL
    USING (public.is_admin());

CREATE POLICY "Everyone can read school_settings"
    ON public.school_settings FOR SELECT
    USING (true);

-- --------------------------------------------------
-- 4l. LAB_INVENTORY
-- --------------------------------------------------
DROP POLICY IF EXISTS "Lab assistants can manage inventory" ON public.lab_inventory;
DROP POLICY IF EXISTS "Teachers can read inventory" ON public.lab_inventory;
DROP POLICY IF EXISTS "Super admin can manage lab inventory" ON public.lab_inventory;
DROP POLICY IF EXISTS "Authenticated users can read lab inventory" ON public.lab_inventory;

CREATE POLICY "Super admin and lab assistants can manage lab_inventory"
    ON public.lab_inventory FOR ALL
    USING (public.is_admin_or_lab());

CREATE POLICY "Teachers can read lab_inventory"
    ON public.lab_inventory FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher');

-- --------------------------------------------------
-- 4m. CLASS_MEMORY
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage class memory" ON public.class_memory;
DROP POLICY IF EXISTS "Students and teachers can read class memory" ON public.class_memory;
DROP POLICY IF EXISTS "Super admin and teachers can manage class memory" ON public.class_memory;
DROP POLICY IF EXISTS "Students can read class memory" ON public.class_memory;

CREATE POLICY "Super admin and teachers can manage class_memory"
    ON public.class_memory FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read class_memory"
    ON public.class_memory FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student');

-- --------------------------------------------------
-- 4n. AGENT_LOGS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can read agent logs" ON public.agent_logs;
DROP POLICY IF EXISTS "Super admin can read agent logs" ON public.agent_logs;

CREATE POLICY "Super admin and teachers can read agent_logs"
    ON public.agent_logs FOR SELECT
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4o. MISTAKE_JOURNALS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Students can CRUD own journals" ON public.mistake_journals;
DROP POLICY IF EXISTS "Teachers can update journals" ON public.mistake_journals;
DROP POLICY IF EXISTS "Admins can read all journals" ON public.mistake_journals;
DROP POLICY IF EXISTS "Super admin and teachers can read all journals" ON public.mistake_journals;

CREATE POLICY "Students can CRUD own mistake_journals"
    ON public.mistake_journals FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update mistake_journals"
    ON public.mistake_journals FOR UPDATE
    USING (public.is_admin_or_teacher());

CREATE POLICY "Super admin and teachers can read mistake_journals"
    ON public.mistake_journals FOR SELECT
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4p. SUPERVISIONS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Principals can manage own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Teachers can read own supervisions" ON public.supervisions;
DROP POLICY IF EXISTS "Teachers can update own signature" ON public.supervisions;

CREATE POLICY "Super admin can manage all supervisions"
    ON public.supervisions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Principals can manage own supervisions"
    ON public.supervisions FOR ALL
    USING (auth.uid() = principal_id);

CREATE POLICY "Teachers can read own supervisions"
    ON public.supervisions FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can sign own supervisions"
    ON public.supervisions FOR UPDATE
    USING (auth.uid() = teacher_id AND status = 'published')
    WITH CHECK (auth.uid() = teacher_id AND status = 'published');

-- --------------------------------------------------
-- 4q. TEACHER_PERFORMANCE_ASSESSMENTS (TPA)
-- --------------------------------------------------
DROP POLICY IF EXISTS "Principals manage own TPA" ON public.teacher_performance_assessments;
DROP POLICY IF EXISTS "Teachers read own TPA" ON public.teacher_performance_assessments;
DROP POLICY IF EXISTS "Teachers submit own TPA scores" ON public.teacher_performance_assessments;

CREATE POLICY "Super admin can manage all TPA"
    ON public.teacher_performance_assessments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Principals manage own TPA"
    ON public.teacher_performance_assessments FOR ALL
    USING (auth.uid() = principal_id);

CREATE POLICY "Teachers read own TPA"
    ON public.teacher_performance_assessments FOR SELECT
    USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers submit own TPA scores"
    ON public.teacher_performance_assessments FOR UPDATE
    USING (auth.uid() = teacher_id AND status = 'principal_submitted')
    WITH CHECK (auth.uid() = teacher_id AND status = 'principal_submitted');

-- --------------------------------------------------
-- 4r. TPA_ACCUMULATIONS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Principals read accumulations" ON public.tpa_accumulations;
DROP POLICY IF EXISTS "Super admin manage accumulations" ON public.tpa_accumulations;

CREATE POLICY "Super admin can manage tpa_accumulations"
    ON public.tpa_accumulations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Principals can read tpa_accumulations"
    ON public.tpa_accumulations FOR SELECT
    USING (public.is_admin_or_principal() OR auth.uid() = teacher_id);

CREATE POLICY "Teachers can read own tpa_accumulations"
    ON public.tpa_accumulations FOR SELECT
    USING (auth.uid() = teacher_id);

-- --------------------------------------------------
-- 4s. ACADEMIC_CALENDARS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Everyone can read calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Super admins can manage all calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.academic_calendars;
DROP POLICY IF EXISTS "Only super_admin can modify calendars" ON public.academic_calendars;

CREATE POLICY "Everyone can read academic_calendars"
    ON public.academic_calendars FOR SELECT
    USING (true);

CREATE POLICY "Super admin can manage all academic_calendars"
    ON public.academic_calendars FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users can insert own academic_calendars"
    ON public.academic_calendars FOR INSERT
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'lab_assistant', 'student', 'principal')
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update own academic_calendars"
    ON public.academic_calendars FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'lab_assistant', 'student', 'principal')
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can delete own academic_calendars"
    ON public.academic_calendars FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'lab_assistant', 'student', 'principal')
        AND created_by = auth.uid()
    );

-- --------------------------------------------------
-- 4t. SAVED_LESSON_PLANS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage lesson plans" ON public.saved_lesson_plans;
DROP POLICY IF EXISTS "Super admin and teachers can manage lesson plans" ON public.saved_lesson_plans;

CREATE POLICY "Super admin and teachers can manage saved_lesson_plans"
    ON public.saved_lesson_plans FOR ALL
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4u. MEDIA_ATTACHMENTS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage media" ON public.media_attachments;
DROP POLICY IF EXISTS "Super admin and teachers can manage media" ON public.media_attachments;

CREATE POLICY "Super admin and teachers can manage media_attachments"
    ON public.media_attachments FOR ALL
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4v. ENTRY_TICKET_RESPONSES
-- --------------------------------------------------
DROP POLICY IF EXISTS "Students can insert own responses" ON public.entry_ticket_responses;
DROP POLICY IF EXISTS "Teachers can read responses" ON public.entry_ticket_responses;
DROP POLICY IF EXISTS "Super admin can read responses" ON public.entry_ticket_responses;

CREATE POLICY "Students can insert own entry_ticket_responses"
    ON public.entry_ticket_responses FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Super admin and teachers can read entry_ticket_responses"
    ON public.entry_ticket_responses FOR SELECT
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4w. KNOWLEDGE_BASE
-- --------------------------------------------------
DROP POLICY IF EXISTS "Super admin and teachers can manage knowledge" ON public.knowledge_base;
DROP POLICY IF EXISTS "Super admin and teachers can manage knowledge base" ON public.knowledge_base;

CREATE POLICY "Super admin and teachers can manage knowledge_base"
    ON public.knowledge_base FOR ALL
    USING (public.is_admin_or_teacher());

-- --------------------------------------------------
-- 4x. AUDIT_LOG
-- --------------------------------------------------
DROP POLICY IF EXISTS "Super admin can read audit logs" ON public.audit_log;

CREATE POLICY "Super admin can read audit_log"
    ON public.audit_log FOR SELECT
    USING (public.is_admin());

-- --------------------------------------------------
-- 4y. DOWNLOAD_LOGS
-- --------------------------------------------------
DROP POLICY IF EXISTS "Download logs viewable by super_admin" ON public.download_logs;
DROP POLICY IF EXISTS "Download logs insertable by authenticated" ON public.download_logs;

CREATE POLICY "Super admin can read download_logs"
    ON public.download_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Authenticated users can insert download_logs"
    ON public.download_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- --------------------------------------------------
-- 4z. SYLLABUS_OBJECTIVES
-- --------------------------------------------------
DROP POLICY IF EXISTS "Super admin and teachers can manage objectives" ON public.syllabus_objectives;

CREATE POLICY "Super admin and teachers can manage syllabus_objectives"
    ON public.syllabus_objectives FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Everyone can read syllabus_objectives"
    ON public.syllabus_objectives FOR SELECT
    USING (true);

-- ============================================================
-- 5. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- school_settings: ensure all columns exist
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS brand_name TEXT DEFAULT 'SHB Learning Hub';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS jhs_vp_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS jhs_principal_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS shs_vp_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS shs_principal_name TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Academic';
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70 CHECK (tpa_principal_weight >= 0 AND tpa_principal_weight <= 100);
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30 CHECK (tpa_teacher_weight >= 0 AND tpa_teacher_weight <= 100);

-- Default row if missing
INSERT INTO public.school_settings (id, school_name, brand_name)
VALUES (1, 'Sekolah Harapan Bangsa', 'SHB Learning Hub')
ON CONFLICT (id) DO NOTHING;

-- weekly_packages: subject column
ALTER TABLE public.weekly_packages ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_packages_subject ON public.weekly_packages(subject);

-- shared_worksheets: ensure all columns
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS score_category TEXT;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS objectives TEXT;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS reference_pdf_url TEXT;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS theory_video_url TEXT;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS theory_video_title TEXT;
ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS page_images TEXT[];
CREATE INDEX IF NOT EXISTS idx_worksheets_subject ON public.shared_worksheets(subject);

-- syllabus_planning: ensure all columns
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'PHY' REFERENCES public.subjects(code);
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS score_category TEXT CHECK (score_category IN ('classwork', 'unit_test', 'project', 'homework', 'mid_semester', 'final_semester'));
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
CREATE INDEX IF NOT EXISTS idx_syllabus_planning_subject ON public.syllabus_planning(subject);

-- student_work: ensure all columns
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS syllabus_id UUID REFERENCES public.syllabus_planning(id) ON DELETE SET NULL;
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS worksheet_id UUID REFERENCES public.shared_worksheets(id) ON DELETE SET NULL;
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS teacher_annotation TEXT;
CREATE INDEX IF NOT EXISTS idx_student_work_subject ON public.student_work(subject);
CREATE INDEX IF NOT EXISTS idx_student_work_syllabus ON public.student_work(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_student_work_worksheet ON public.student_work(worksheet_id);

-- lab_inventory: subject column
ALTER TABLE public.lab_inventory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_lab_inventory_subject ON public.lab_inventory(subject);

-- class_memory: subject column
ALTER TABLE public.class_memory ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_class_memory_subject ON public.class_memory(subject);

-- ai_providers: owner_id column
ALTER TABLE public.ai_providers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_ai_providers_owner ON public.ai_providers(owner_id);

-- syllabus_documents: published and score_category
ALTER TABLE public.syllabus_documents ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE public.syllabus_documents ADD COLUMN IF NOT EXISTS score_category TEXT;

-- mistake_journals: subject column
ALTER TABLE public.mistake_journals ADD COLUMN IF NOT EXISTS subject TEXT REFERENCES public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_journals_subject ON public.mistake_journals(subject);

-- academic_calendars: personal events columns
ALTER TABLE public.academic_calendars ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.academic_calendars ADD COLUMN IF NOT EXISTS personal BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_calendars_year_week ON public.academic_calendars(academic_year, week_number);

-- ============================================================
-- 6. ENSURE UNIQUE CONSTRAINTS AFTER ADDING SUBJECT COLUMNS
-- ============================================================

DO $$
BEGIN
  -- syllabus_topics: drop old unique, add new with subject
  ALTER TABLE public.syllabus_topics
    DROP CONSTRAINT IF EXISTS syllabus_topics_grade_unit_id_key;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'syllabus_topics_grade_unit_id_subject_key'
    AND table_name = 'syllabus_topics'
  ) THEN
    ALTER TABLE public.syllabus_topics
      ADD CONSTRAINT syllabus_topics_grade_unit_id_subject_key UNIQUE(grade, unit_id, subject);
  END IF;

  -- syllabus_planning: drop old unique, add new with subject
  ALTER TABLE public.syllabus_planning
    DROP CONSTRAINT IF EXISTS syllabus_planning_academic_year_grade_week_number_key;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'syllabus_planning_academic_year_grade_week_subject_key'
    AND table_name = 'syllabus_planning'
  ) THEN
    ALTER TABLE public.syllabus_planning
      ADD CONSTRAINT syllabus_planning_academic_year_grade_week_subject_key UNIQUE(academic_year, grade, week_number, subject);
  END IF;
END $$;

-- ============================================================
-- 7. RE-CREATE TRIGGERS IF MISSING
-- ============================================================

DROP TRIGGER IF EXISTS update_supervisions_updated_at ON public.supervisions;
CREATE TRIGGER update_supervisions_updated_at
    BEFORE UPDATE ON public.supervisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tpa_updated_at ON public.teacher_performance_assessments;
CREATE TRIGGER update_tpa_updated_at
    BEFORE UPDATE ON public.teacher_performance_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_providers_updated_at ON public.ai_providers;
CREATE TRIGGER update_ai_providers_updated_at
    BEFORE UPDATE ON public.ai_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('worksheets', 'worksheets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
