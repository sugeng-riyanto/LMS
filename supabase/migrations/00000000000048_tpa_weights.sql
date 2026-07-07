-- Add TPA weight columns to school_settings
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70 CHECK (tpa_principal_weight >= 0 AND tpa_principal_weight <= 100);
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30 CHECK (tpa_teacher_weight >= 0 AND tpa_teacher_weight <= 100);
