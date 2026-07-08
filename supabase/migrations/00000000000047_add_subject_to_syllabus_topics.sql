-- Add subject column to syllabus_topics for multi-subject support
ALTER TABLE public.syllabus_topics
  ADD COLUMN subject TEXT NOT NULL DEFAULT 'PHY';

-- Drop old unique constraint and add new one with subject
ALTER TABLE public.syllabus_topics
  DROP CONSTRAINT IF EXISTS syllabus_topics_grade_unit_id_key;

ALTER TABLE public.syllabus_topics
  ADD CONSTRAINT syllabus_topics_grade_unit_id_subject_key UNIQUE(grade, unit_id, subject);

-- Update RLS: teachers can modify topics for their subjects
DROP POLICY IF EXISTS "Only super_admin can modify topics" ON public.syllabus_topics;

CREATE POLICY "Admin and teacher can modify topics" ON public.syllabus_topics
  FOR ALL USING (public.is_admin_or_teacher());

-- Also add subject to syllabus_planning if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'syllabus_planning' AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.syllabus_planning
      ADD COLUMN subject TEXT NOT NULL DEFAULT 'PHY';

    -- Drop old unique constraint
    ALTER TABLE public.syllabus_planning
      DROP CONSTRAINT IF EXISTS syllabus_planning_academic_year_grade_week_number_key;

    -- Add new unique with subject
    ALTER TABLE public.syllabus_planning
      ADD CONSTRAINT syllabus_planning_academic_year_grade_week_subject_key UNIQUE(academic_year, grade, week_number, subject);
  END IF;
END $$;
