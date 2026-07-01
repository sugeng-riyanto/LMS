CREATE TABLE public.shared_worksheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    week_number INT,
    topic TEXT,
    pdf_url TEXT NOT NULL,
    pdf_pages INT DEFAULT 1,
    media_links JSONB DEFAULT '[]',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shared_worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared worksheets"
    ON public.shared_worksheets FOR SELECT USING (true);

CREATE POLICY "Admin and teacher can manage shared worksheets"
    ON public.shared_worksheets FOR ALL USING (public.is_admin_or_teacher());

CREATE INDEX idx_shared_worksheets_grade ON public.shared_worksheets(grade);
CREATE INDEX idx_shared_worksheets_created_by ON public.shared_worksheets(created_by);

CREATE TRIGGER update_shared_worksheets_updated_at
    BEFORE UPDATE ON public.shared_worksheets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
