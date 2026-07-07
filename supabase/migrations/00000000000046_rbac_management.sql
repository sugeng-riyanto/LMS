-- RBAC management: dynamic role-based route permissions + principal assignment CRUD

-- 1. ROLE PERMISSIONS table (overrides for proxy.ts hardcoded routes)
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

-- Seed defaults from current proxy.ts ROLE_ROUTES
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
  ('/syllabus', 'super_admin'), ('/syllabus', 'teacher'),
  ('/syllabus-manager', 'super_admin'), ('/syllabus-manager', 'teacher'),
  ('/worksheets', 'super_admin'), ('/worksheets', 'teacher'),
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
