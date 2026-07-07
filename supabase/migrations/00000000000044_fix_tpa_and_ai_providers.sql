-- ============================================================
-- Fix TPA tables (migrations 40/42 never applied) 
-- + AI providers RLS (teachers/principals can't insert)
-- + Helper functions (missing `principal` in role checks)
-- ============================================================

-- 0. Create missing utility function (init migration never applied)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. RECREATE helper functions to include principal
CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher', 'principal'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_principal()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'principal'))
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. TEACHER PERFORMANCE ASSESSMENTS table (migration 40)
CREATE TABLE IF NOT EXISTS public.teacher_performance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
    principal_id UUID NOT NULL REFERENCES public.profiles(id),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    subject TEXT,
    grade INT CHECK (grade BETWEEN 7 AND 12),
    class_name TEXT,
    principal_scores JSONB,
    principal_total DECIMAL,
    principal_submitted_at TIMESTAMPTZ,
    principal_signature TEXT,
    principal_signed_at TIMESTAMPTZ,
    teacher_scores JSONB,
    teacher_total DECIMAL,
    teacher_submitted_at TIMESTAMPTZ,
    teacher_signature TEXT,
    teacher_signed_at TIMESTAMPTZ,
    combined_total DECIMAL,
    combined_grade TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'principal_submitted', 'teacher_submitted', 'completed')),
    period_type TEXT DEFAULT 'semester' CHECK (period_type IN ('monthly', 'quarterly', 'semester')),
    period_label TEXT,
    unpublished_at TIMESTAMPTZ,
    pre_appraisal_held BOOLEAN DEFAULT false,
    post_conference_held BOOLEAN DEFAULT false,
    visit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teacher_performance_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Principals manage own TPA" ON public.teacher_performance_assessments;
CREATE POLICY "Principals manage own TPA"
    ON public.teacher_performance_assessments FOR ALL
    USING (auth.uid() = principal_id OR public.is_admin());

DROP POLICY IF EXISTS "Teachers read own TPA" ON public.teacher_performance_assessments;
CREATE POLICY "Teachers read own TPA"
    ON public.teacher_performance_assessments FOR SELECT
    USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers submit own TPA scores" ON public.teacher_performance_assessments;
CREATE POLICY "Teachers submit own TPA scores"
    ON public.teacher_performance_assessments FOR UPDATE
    USING (auth.uid() = teacher_id AND status = 'principal_submitted')
    WITH CHECK (auth.uid() = teacher_id AND status = 'principal_submitted');

CREATE INDEX IF NOT EXISTS idx_tpa_teacher ON public.teacher_performance_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tpa_principal ON public.teacher_performance_assessments(principal_id);
CREATE INDEX IF NOT EXISTS idx_tpa_semester ON public.teacher_performance_assessments(academic_year, semester);

DROP TRIGGER IF EXISTS update_tpa_updated_at ON public.teacher_performance_assessments;
CREATE TRIGGER update_tpa_updated_at
    BEFORE UPDATE ON public.teacher_performance_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. TPA ACCUMULATIONS table (migration 42)
CREATE TABLE IF NOT EXISTS public.tpa_accumulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester_1_score DECIMAL,
    semester_1_grade TEXT,
    semester_2_score DECIMAL,
    semester_2_grade TEXT,
    annual_average DECIMAL,
    annual_grade TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, academic_year)
);

ALTER TABLE public.tpa_accumulations ENABLE ROW LEVEL security;

DROP POLICY IF EXISTS "Principals read accumulations" ON public.tpa_accumulations;
CREATE POLICY "Principals read accumulations"
    ON public.tpa_accumulations FOR SELECT
    USING (public.is_admin_or_principal() OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Super admin manage accumulations" ON public.tpa_accumulations;
CREATE POLICY "Super admin manage accumulations"
    ON public.tpa_accumulations FOR ALL
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_tpa_acc_teacher ON public.tpa_accumulations(teacher_id);

-- 4. AI PROVIDERS table (migration 03 + 33 never applied)
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'groq', 'gemini', 'opencodeai')),
    api_key TEXT NOT NULL,
    base_url TEXT,
    default_model TEXT NOT NULL,
    available_models JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    config JSONB DEFAULT '{"temperature": 0.7, "max_tokens": 4096}',
    last_tested_at TIMESTAMPTZ,
    test_status TEXT CHECK (test_status IN ('untested', 'working', 'failed')),
    created_by UUID REFERENCES public.profiles(id),
    owner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON public.ai_providers(is_active, priority);
CREATE INDEX IF NOT EXISTS idx_ai_providers_owner ON public.ai_providers(owner_id);

DROP TRIGGER IF EXISTS update_ai_providers_updated_at ON public.ai_providers;
CREATE TRIGGER update_ai_providers_updated_at
    BEFORE UPDATE ON public.ai_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. AI PROVIDERS RLS — allow teachers/principals to manage their own providers
DROP POLICY IF EXISTS "Only super_admin can manage AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers can read active AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Super admin can manage all AI providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can read all providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can insert own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can update own providers" ON public.ai_providers;
DROP POLICY IF EXISTS "Teachers and principals can delete own providers" ON public.ai_providers;

CREATE POLICY "Super admin can manage all AI providers"
    ON public.ai_providers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Teachers and principals can read all providers"
    ON public.ai_providers FOR SELECT
    USING (true);

CREATE POLICY "Teachers and principals can insert own providers"
    ON public.ai_providers FOR INSERT
    WITH CHECK (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can update own providers"
    ON public.ai_providers FOR UPDATE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());

CREATE POLICY "Teachers and principals can delete own providers"
    ON public.ai_providers FOR DELETE
    USING (public.is_admin_or_teacher() AND owner_id = auth.uid());
