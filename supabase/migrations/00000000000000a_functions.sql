-- Run this FIRST as a single batch in Supabase SQL Editor
-- Then run 00000000000037_catchup_missing.sql

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_lab()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'lab_assistant'))
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_grade()
RETURNS INT LANGUAGE plpgsql STABLE SECURITY DEFINER AS $f$
BEGIN
  RETURN (SELECT grade_assigned FROM public.profiles WHERE id = auth.uid());
END;
$f$;
