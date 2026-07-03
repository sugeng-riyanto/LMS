ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS score_category TEXT CHECK (score_category IN ('classwork', 'unit_test', 'project', 'homework', 'mid_semester', 'final_semester'));
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
