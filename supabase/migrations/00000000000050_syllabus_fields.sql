ALTER TABLE public.syllabus_planning
  ADD COLUMN objectives TEXT,
  ADD COLUMN evaluation JSONB DEFAULT '{}',
  ADD COLUMN milestone TEXT,
  ADD COLUMN reflection TEXT;

ALTER TABLE public.shared_worksheets
  ADD COLUMN evaluation JSONB DEFAULT '{}',
  ADD COLUMN milestone TEXT,
  ADD COLUMN reflection TEXT;
