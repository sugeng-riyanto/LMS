-- Add media_links JSONB to syllabus_planning for embedded sources
ALTER TABLE public.syllabus_planning
ADD COLUMN IF NOT EXISTS media_links JSONB DEFAULT '[]';
