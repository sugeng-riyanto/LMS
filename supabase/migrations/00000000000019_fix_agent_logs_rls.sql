-- Fix agent_logs RLS: allow teachers to insert agent logs during generation
-- Previously only super_admin could modify, now teachers can insert too

DROP POLICY IF EXISTS "Only super_admin can read agent logs" ON public.agent_logs;

CREATE POLICY "Only super_admin can read agent logs" ON public.agent_logs
    FOR ALL USING (public.is_admin());

CREATE POLICY "Teachers can insert agent logs" ON public.agent_logs
    FOR INSERT WITH CHECK (public.is_admin_or_teacher());
