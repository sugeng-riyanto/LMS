ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS syllabus_id UUID REFERENCES public.syllabus_planning(id) ON DELETE SET NULL;
ALTER TABLE public.student_work ADD COLUMN IF NOT EXISTS worksheet_id UUID REFERENCES public.shared_worksheets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_work_syllabus ON public.student_work(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_student_work_worksheet ON public.student_work(worksheet_id);
