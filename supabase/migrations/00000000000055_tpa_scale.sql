ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30;
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS assessment_scale TEXT DEFAULT '0-4';
INSERT INTO public.school_settings (id, school_name) VALUES (1, 'SHB') ON CONFLICT (id) DO NOTHING;
