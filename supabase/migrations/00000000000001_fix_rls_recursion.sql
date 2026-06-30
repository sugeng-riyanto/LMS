-- Fix recursive RLS policies that cause 500 errors
-- The old pattern: EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'x')
-- causes infinite recursion detection because the subquery hits RLS on profiles.
-- Solution: SECURITY DEFINER helper functions that BYPASS RLS.

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_lab()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'lab_assistant'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_grade()
RETURNS INT AS $$
    SELECT grade_assigned FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- RECREATE PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- ============================================
-- RECREATE ACADEMIC CALENDARS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Everyone can read calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Only super_admin can modify calendars" ON public.academic_calendars;

CREATE POLICY "Everyone can read calendars" ON public.academic_calendars
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify calendars" ON public.academic_calendars
    FOR ALL USING (public.is_admin());

-- ============================================
-- RECREATE WEEKLY PACKAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins and teachers can CRUD packages" ON public.weekly_packages;
DROP POLICY IF EXISTS "Lab assistants can read logistics" ON public.weekly_packages;
DROP POLICY IF EXISTS "Students can read published packages for their grade" ON public.weekly_packages;

CREATE POLICY "Admins and teachers can CRUD packages" ON public.weekly_packages
    FOR ALL USING (public.is_admin_or_teacher());

CREATE POLICY "Lab assistants can read logistics" ON public.weekly_packages
    FOR SELECT USING (public.is_admin_or_lab());

CREATE POLICY "Students can read published packages for their grade" ON public.weekly_packages
    FOR SELECT USING (
        public.is_student()
        AND status = 'published'
        AND grade = public.current_user_grade()
    );

-- ============================================
-- RECREATE CLASS MEMORY POLICIES
-- ============================================

DROP POLICY IF EXISTS "Only super_admin can manage memory" ON public.class_memory;
DROP POLICY IF EXISTS "Teachers can read memory" ON public.class_memory;

CREATE POLICY "Only super_admin can manage memory" ON public.class_memory
    FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can read memory" ON public.class_memory
    FOR SELECT USING (public.is_admin_or_teacher());

-- ============================================
-- RECREATE LAB INVENTORY POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admin and lab assistant can manage inventory" ON public.lab_inventory;

CREATE POLICY "Admin and lab assistant can manage inventory" ON public.lab_inventory
    FOR ALL USING (public.is_admin_or_lab());

-- ============================================
-- RECREATE MISTAKE JOURNALS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can CRUD own journals" ON public.mistake_journals;
DROP POLICY IF EXISTS "Admins can read all journals" ON public.mistake_journals;

CREATE POLICY "Students can CRUD own journals" ON public.mistake_journals
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all journals" ON public.mistake_journals
    FOR SELECT USING (public.is_admin());

-- ============================================
-- RECREATE KNOWLEDGE BASE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Everyone can read knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Only super_admin can modify KB" ON public.knowledge_base;

CREATE POLICY "Everyone can read knowledge base" ON public.knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify KB" ON public.knowledge_base
    FOR ALL USING (public.is_admin());

-- ============================================
-- RECREATE AUDIT LOG POLICIES
-- ============================================

DROP POLICY IF EXISTS "Only super_admin can read audit logs" ON public.audit_log;

CREATE POLICY "Only super_admin can read audit logs" ON public.audit_log
    FOR ALL USING (public.is_admin());

-- ============================================
-- RECREATE ENTRY TICKET POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can CRUD own responses" ON public.entry_ticket_responses;
DROP POLICY IF EXISTS "Teachers can read responses" ON public.entry_ticket_responses;

CREATE POLICY "Students can CRUD own responses" ON public.entry_ticket_responses
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can read responses" ON public.entry_ticket_responses
    FOR SELECT USING (public.is_admin_or_teacher());

-- ============================================
-- RECREATE AGENT LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Only super_admin can read agent logs" ON public.agent_logs;

CREATE POLICY "Only super_admin can read agent logs" ON public.agent_logs
    FOR ALL USING (public.is_admin());

