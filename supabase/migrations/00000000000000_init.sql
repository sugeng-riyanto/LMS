-- ============================================
-- PHYSICS COMMAND CENTER - MASTER SCHEMA
-- Academic Year 2026-2027
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM TYPES
CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'teacher',
    'lab_assistant',
    'student'
);

CREATE TYPE public.package_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'published',
    'archived'
);

CREATE TYPE public.calendar_event_type AS ENUM (
    'normal',
    'holiday',
    'exam',
    'tryout',
    'mock_test',
    'offsite',
    'blackout',
    'pd_day'
);

-- 3. PROFILES (RBAC)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role public.app_role DEFAULT 'student',
    grade_assigned INT CHECK (grade_assigned BETWEEN 7 AND 12 OR grade_assigned IS NULL),
    avatar_url TEXT,
    phone_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACADEMIC CALENDARS
CREATE TABLE public.academic_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    month INT CHECK (month BETWEEN 1 AND 12),
    week_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    effective_days INT DEFAULT 5,
    event_name TEXT,
    event_type public.calendar_event_type DEFAULT 'normal',
    affected_grades INT[] DEFAULT '{7,8,9,10,11,12}',
    is_holiday BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year, week_number, month)
);

-- 5. WEEKLY PACKAGES
CREATE TABLE public.weekly_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    grade INT CHECK (grade BETWEEN 7 AND 12),
    week_number INT NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    date_range_start DATE,
    date_range_end DATE,
    topic TEXT,
    syllabus_ref TEXT,
    calendar_status TEXT DEFAULT 'normal',
    effective_days INT DEFAULT 5,
    lesson_plan JSONB,
    worksheet JSONB,
    pre_class JSONB,
    lab_logistics JSONB,
    answer_keys JSONB,
    wa_blast TEXT,
    status public.package_status DEFAULT 'draft',
    created_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year, grade, week_number)
);

-- 6. CLASS MEMORY
CREATE TABLE public.class_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    grade INT CHECK (grade BETWEEN 7 AND 12),
    week_number INT NOT NULL,
    topic_taught TEXT,
    misconceptions JSONB DEFAULT '[]',
    average_classwork_score FLOAT,
    students_struggling JSONB DEFAULT '[]',
    students_advanced JSONB DEFAULT '[]',
    lab_equipment_status JSONB DEFAULT '{}',
    notes_for_next_week TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year, grade, week_number)
);

-- 7. LAB INVENTORY
CREATE TABLE public.lab_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT,
    total_quantity INT DEFAULT 0,
    available_quantity INT DEFAULT 0,
    broken_quantity INT DEFAULT 0,
    location TEXT,
    last_restocked_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STUDENT MISTAKE JOURNALS
CREATE TABLE public.mistake_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade INT CHECK (grade BETWEEN 7 AND 12),
    entry_date DATE DEFAULT CURRENT_DATE,
    topic TEXT NOT NULL,
    mistake_description TEXT NOT NULL,
    root_cause TEXT,
    correct_approach TEXT,
    law_or_principle TEXT,
    related_package_id UUID REFERENCES public.weekly_packages(id),
    teacher_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. KNOWLEDGE BASE (RAG with pgvector)
CREATE TABLE public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_name, chunk_index)
);

-- 10. AUDIT LOG
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ENTRY TICKET QUIZZES
CREATE TABLE public.entry_ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.weekly_packages(id),
    question_id TEXT NOT NULL,
    student_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AGENT EXECUTION LOGS
CREATE TABLE public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL,
    agent_name TEXT NOT NULL,
    grade INT,
    week_number INT,
    status TEXT CHECK (status IN ('started', 'running', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    execution_time_ms INT,
    tokens_used INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_grade ON public.profiles(grade_assigned);
CREATE INDEX idx_calendars_year_week ON public.academic_calendars(academic_year, week_number);
CREATE INDEX idx_packages_grade_week ON public.weekly_packages(grade, week_number);
CREATE INDEX idx_packages_status ON public.weekly_packages(status);
CREATE INDEX idx_memory_grade_week ON public.class_memory(grade, week_number);
CREATE INDEX idx_journals_student ON public.mistake_journals(student_id);
CREATE INDEX idx_kb_filename ON public.knowledge_base(file_name);
CREATE INDEX idx_agent_logs_execution ON public.agent_logs(execution_id);

CREATE INDEX idx_kb_embedding ON public.knowledge_base 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
    );

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Academic calendars policies
CREATE POLICY "Everyone can read calendars" ON public.academic_calendars
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify calendars" ON public.academic_calendars
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Weekly packages policies
CREATE POLICY "Admins and teachers can CRUD packages" ON public.weekly_packages
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
    );

CREATE POLICY "Lab assistants can read logistics" ON public.weekly_packages
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lab_assistant')
    );

CREATE POLICY "Students can read published packages for their grade" ON public.weekly_packages
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
        AND status = 'published'
        AND grade = (SELECT grade_assigned FROM public.profiles WHERE id = auth.uid())
    );

-- Class memory policies
CREATE POLICY "Only super_admin can manage memory" ON public.class_memory
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "Teachers can read memory" ON public.class_memory
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
    );

-- Lab inventory policies
CREATE POLICY "Admin and lab assistant can manage inventory" ON public.lab_inventory
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'lab_assistant'))
    );

-- Mistake journals policies
CREATE POLICY "Students can CRUD own journals" ON public.mistake_journals
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all journals" ON public.mistake_journals
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Knowledge base policies
CREATE POLICY "Everyone can read knowledge base" ON public.knowledge_base
    FOR SELECT USING (true);

CREATE POLICY "Only super_admin can modify KB" ON public.knowledge_base
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Audit log policies
CREATE POLICY "Only super_admin can read audit logs" ON public.audit_log
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Entry ticket policies
CREATE POLICY "Students can CRUD own responses" ON public.entry_ticket_responses
    FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can read responses" ON public.entry_ticket_responses
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
    );

-- Agent logs policies
CREATE POLICY "Only super_admin can read agent logs" ON public.agent_logs
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.weekly_packages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journals_updated_at
    BEFORE UPDATE ON public.mistake_journals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.match_knowledge_base(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 5,
    filter_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    file_name TEXT,
    chunk_text TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.file_name,
        kb.chunk_text,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_base kb
    WHERE kb.metadata @> filter_metadata
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (user_id, action, resource_type, resource_id, details)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object('new', NEW, 'old', OLD)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

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
