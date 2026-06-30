-- Media attachments for weekly package sections (PDF, video, audio)
CREATE TABLE public.media_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.weekly_packages(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('lesson-plan', 'worksheet', 'pre-class', 'lab-logistics', 'wa-blast', 'answer-keys')),
    media_type TEXT NOT NULL CHECK (media_type IN ('pdf', 'video', 'audio', 'link', 'embed')),
    title TEXT NOT NULL,
    url TEXT,
    embed_code TEXT,
    file_data TEXT,
    file_size INT,
    sort_order INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage media"
    ON public.media_attachments FOR ALL
    USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read media"
    ON public.media_attachments FOR SELECT
    USING (true);

CREATE INDEX idx_media_attachments_package ON public.media_attachments(package_id, section);
