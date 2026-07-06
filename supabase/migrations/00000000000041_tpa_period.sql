-- TPA period support: monthly, quarterly, semester + unpublish

ALTER TABLE public.teacher_performance_assessments
  ADD COLUMN IF NOT EXISTS period_type TEXT NOT NULL DEFAULT 'semester' CHECK (period_type IN ('monthly', 'quarterly', 'semester'));

ALTER TABLE public.teacher_performance_assessments
  ADD COLUMN IF NOT EXISTS period_label TEXT;

ALTER TABLE public.teacher_performance_assessments
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ;

-- Allow principal to revert from principal_submitted back to draft
DROP POLICY IF EXISTS "Principals manage own TPA" ON public.teacher_performance_assessments;
CREATE POLICY "Principals manage own TPA"
    ON public.teacher_performance_assessments FOR ALL
    USING (auth.uid() = principal_id OR public.is_admin());
