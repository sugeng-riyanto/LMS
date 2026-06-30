-- Saved lesson plans for teachers
CREATE TABLE public.saved_lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    week INT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own lesson plans"
    ON public.saved_lesson_plans FOR ALL
    USING (public.is_admin_or_teacher());

CREATE INDEX idx_saved_lesson_plans_creator ON public.saved_lesson_plans(created_by);

CREATE TRIGGER update_saved_lesson_plans_updated_at
    BEFORE UPDATE ON public.saved_lesson_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
