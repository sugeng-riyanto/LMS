-- Publish gate: student_work.published_at + student_notifications table

ALTER TABLE public.student_work ADD COLUMN published_at TIMESTAMPTZ;

CREATE TABLE public.student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'grade_published', 'feedback', 'announcement')),
    read BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own notifications"
    ON public.student_notifications FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students update own notifications (read)"
    ON public.student_notifications FOR UPDATE
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers insert notifications"
    ON public.student_notifications FOR INSERT
    WITH CHECK (public.is_admin_or_teacher());

CREATE POLICY "Teachers read notifications"
    ON public.student_notifications FOR SELECT
    USING (public.is_admin_or_teacher());

CREATE INDEX idx_notifications_student ON public.student_notifications(student_id);
CREATE INDEX idx_notifications_read ON public.student_notifications(read);
