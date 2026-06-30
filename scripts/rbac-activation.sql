-- ============================================
-- RBAC ACTIVATION SQL
-- Paste this into Supabase Dashboard > SQL Editor
-- ============================================

-- 1. VERIFY YOUR PROFILE
SELECT id, email, role, full_name, is_active, grade_assigned
FROM public.profiles
WHERE email = 'admin@shb.sch.id';

-- 2. VERIFY ALL RLS POLICIES
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VERIFY VIEWS
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('student_performance', 'weekly_package_summary');

-- 4. RECREATE VIEWS (if missing)
CREATE OR REPLACE VIEW public.student_performance AS
SELECT
    p.id AS student_id,
    p.full_name,
    p.grade_assigned,
    COUNT(mj.id) AS total_journal_entries,
    AVG(et.is_correct::INT) * 100 AS entry_ticket_accuracy,
    COUNT(DISTINCT et.package_id) AS packages_attempted
FROM public.profiles p
LEFT JOIN public.mistake_journals mj ON p.id = mj.student_id
LEFT JOIN public.entry_ticket_responses et ON p.id = et.student_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.grade_assigned;

CREATE OR REPLACE VIEW public.weekly_package_summary AS
SELECT
    grade,
    week_number,
    COUNT(*) AS total_packages,
    COUNT(*) FILTER (WHERE status = 'published') AS published_count,
    COUNT(*) FILTER (WHERE status = 'pending_review') AS pending_count,
    AVG(effective_days) AS avg_effective_days
FROM public.weekly_packages
GROUP BY grade, week_number;

-- 5. RE-ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 6. VERIFY AUTH TRIGGER ON profiles
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 7. FORCE REFRESH SESSION (run this after login)
-- Log out and log back in, or run:
-- SELECT extensions.pg_reload_conf();
