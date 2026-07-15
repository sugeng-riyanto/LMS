ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS feature_visibility JSONB DEFAULT '{"lesson_plan_alternative": true, "grades_alternative": true, "generate_dev": true, "memory_dev": true}'::jsonb;
