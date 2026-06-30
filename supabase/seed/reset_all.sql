-- ============================================
-- RESET SCRIPT: Clears all data, keeps schema
-- Run AFTER all migrations are applied
-- ============================================

-- Disable RLS temporarily for cleanup
ALTER TABLE public.school_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_planning DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers DISABLE ROW LEVEL SECURITY;

-- Truncate all data tables (order matters for FK)
TRUNCATE TABLE public.agent_logs CASCADE;
TRUNCATE TABLE public.entry_ticket_responses CASCADE;
TRUNCATE TABLE public.mistake_journals CASCADE;
TRUNCATE TABLE public.class_memory CASCADE;
TRUNCATE TABLE public.weekly_packages CASCADE;
TRUNCATE TABLE public.academic_calendars CASCADE;
TRUNCATE TABLE public.lab_inventory CASCADE;
TRUNCATE TABLE public.knowledge_base CASCADE;
TRUNCATE TABLE public.audit_log CASCADE;
TRUNCATE TABLE public.syllabus_planning CASCADE;
TRUNCATE TABLE public.syllabus_topics CASCADE;
TRUNCATE TABLE public.ai_providers CASCADE;
TRUNCATE TABLE public.school_settings CASCADE;

-- Re-enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DEFAULT SEED DATA
-- ============================================

-- School Settings (singleton row)
INSERT INTO public.school_settings (id, school_name, vp_name, principal_name, shs_vp_name, shs_principal_name, unit)
VALUES (1, 'Sekolah Harapan Bangsa - Modernhill',
        'Christina Sri Waryanti, S.Pd.', 'Sisilia Juni Arianti, S.Pd., M.Pd.',
        'Aji Wahyu Budiyanto, M.Si', 'Dr Agustinus Joko Purwanto, S.Pd., M.M.',
        'Academic')
ON CONFLICT (id) DO UPDATE SET
    school_name = EXCLUDED.school_name,
    vp_name = EXCLUDED.vp_name,
    principal_name = EXCLUDED.principal_name,
    shs_vp_name = EXCLUDED.shs_vp_name,
    shs_principal_name = EXCLUDED.shs_principal_name,
    unit = EXCLUDED.unit;

-- Notes for user:
-- To restore remaining seed data, run:
--   node scripts/seed-users.js
--   node scripts/seed-syllabus-topics.js
-- Then import these SQL files via Supabase dashboard:
--   supabase/seed/seed_calendar_2026-2027.sql
--   supabase/seed/seed_lab_inventory.sql
