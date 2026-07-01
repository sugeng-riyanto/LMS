-- Fix lab_inventory RLS: allow teachers and students to read inventory
-- Previously only admin and lab_assistant could access

DROP POLICY IF EXISTS "Admin and lab assistant can manage inventory" ON public.lab_inventory;

CREATE POLICY "Admin and lab assistant can manage inventory" ON public.lab_inventory
    FOR ALL USING (public.is_admin_or_lab());

CREATE POLICY "Teachers can read inventory" ON public.lab_inventory
    FOR SELECT USING (public.is_admin_or_teacher());

CREATE POLICY "Students can read inventory" ON public.lab_inventory
    FOR SELECT USING (public.is_student());
