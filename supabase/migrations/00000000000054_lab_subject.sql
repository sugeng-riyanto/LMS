ALTER TABLE public.lab_inventory
  ADD COLUMN IF NOT EXISTS subject_code TEXT REFERENCES public.subjects(code) ON DELETE SET NULL;
