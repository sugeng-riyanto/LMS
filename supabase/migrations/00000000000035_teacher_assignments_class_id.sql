-- Migration 00035: Add class_id to teacher_assignments for class-level assignment

ALTER TABLE public.teacher_assignments
ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_teacher_assignments_teacher;
DROP INDEX IF EXISTS idx_teacher_assignments_grade;

CREATE INDEX idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_class ON public.teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_grade ON public.teacher_assignments(grade);
