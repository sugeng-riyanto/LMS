-- Fix mistake_journals RLS: allow teachers to update journals (provide teacher_feedback)
-- Previously only students (own) and super_admin could update

DROP POLICY IF EXISTS "Admins can read all journals" ON public.mistake_journals;

CREATE POLICY "Teachers can update journals" ON public.mistake_journals
    FOR UPDATE USING (public.is_admin_or_teacher());

CREATE POLICY "Admins can read all journals" ON public.mistake_journals
    FOR SELECT USING (public.is_admin_or_teacher());
