ALTER TABLE public.teacher_performance_assessments
  DROP CONSTRAINT IF EXISTS teacher_performance_assessments_teacher_id_fkey,
  ADD CONSTRAINT teacher_performance_assessments_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_performance_assessments
  DROP CONSTRAINT IF EXISTS teacher_performance_assessments_principal_id_fkey,
  ADD CONSTRAINT teacher_performance_assessments_principal_id_fkey
    FOREIGN KEY (principal_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.supervisions
  DROP CONSTRAINT IF EXISTS supervisions_teacher_id_fkey,
  ADD CONSTRAINT supervisions_teacher_id_fkey
    FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.supervisions
  DROP CONSTRAINT IF EXISTS supervisions_principal_id_fkey,
  ADD CONSTRAINT supervisions_principal_id_fkey
    FOREIGN KEY (principal_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
