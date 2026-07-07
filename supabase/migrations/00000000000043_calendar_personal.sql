CREATE TABLE IF NOT EXISTS public.academic_calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    month INT CHECK (month BETWEEN 1 AND 12),
    week_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    effective_days INT DEFAULT 5,
    event_name TEXT,
    event_type TEXT DEFAULT 'normal',
    affected_grades INT[] DEFAULT '{7,8,9,10,11,12}',
    is_holiday BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    personal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year, week_number, month)
);

ALTER TABLE public.academic_calendars ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.academic_calendars ADD COLUMN IF NOT EXISTS personal BOOLEAN DEFAULT FALSE;

ALTER TABLE public.academic_calendars ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_calendars_year_week ON public.academic_calendars(academic_year, week_number);

DROP POLICY IF EXISTS "Only super_admin can modify calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Everyone can read calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Super admins can manage all calendars" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.academic_calendars;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.academic_calendars;

CREATE POLICY "Everyone can read calendars" ON public.academic_calendars
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage all calendars" ON public.academic_calendars
  FOR ALL USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can insert their own calendar events" ON public.academic_calendars
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'lab_assistant', 'student', 'principal'))
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own calendar events" ON public.academic_calendars
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'lab_assistant', 'student', 'principal'))
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own calendar events" ON public.academic_calendars
  FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'lab_assistant', 'student', 'principal'))
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and principals can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'teacher', 'principal'))
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

CREATE POLICY "Super admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
