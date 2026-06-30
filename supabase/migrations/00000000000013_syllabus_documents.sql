-- Syllabus documents uploaded by teachers
CREATE TABLE public.syllabus_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL CHECK (grade BETWEEN 7 AND 12),
    subject TEXT NOT NULL DEFAULT 'Physics',
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_content TEXT NOT NULL,
    file_size INT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.syllabus_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage syllabus documents"
    ON public.syllabus_documents FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read syllabus documents"
    ON public.syllabus_documents FOR SELECT
    USING (true);
