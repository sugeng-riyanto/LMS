-- Fix class_memory RLS: allow teachers to manage memory (insert/update/delete)
-- Previously only super_admin could modify, now teachers can too

DROP POLICY IF EXISTS "Only super_admin can manage memory" ON public.class_memory;

CREATE POLICY "Only super_admin can manage memory" ON public.class_memory
    FOR ALL USING (public.is_admin_or_teacher());
