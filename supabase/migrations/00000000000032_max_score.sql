ALTER TABLE public.shared_worksheets ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
ALTER TABLE public.syllabus_planning ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100 CHECK (max_score > 0);
ALTER TABLE public.shared_worksheets ALTER COLUMN score_category SET DEFAULT 'classwork';
UPDATE public.shared_worksheets SET score_category = 'classwork' WHERE score_category IS NULL;
ALTER TABLE public.syllabus_planning ALTER COLUMN score_category SET DEFAULT 'classwork';
UPDATE public.syllabus_planning SET score_category = 'classwork' WHERE score_category IS NULL;
