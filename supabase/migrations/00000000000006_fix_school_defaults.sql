-- Add SHS columns and update defaults (table already exists)
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS shs_vp_name TEXT NOT NULL DEFAULT 'Aji Wahyu Budiyanto, M.Si',
ADD COLUMN IF NOT EXISTS shs_principal_name TEXT NOT NULL DEFAULT 'Dr Agustinus Joko Purwanto, S.Pd., M.M.';

-- Update JHS defaults
UPDATE public.school_settings
SET vp_name = 'Christina Sri Waryanti, S.Pd.',
    principal_name = 'Sisilia Juni Arianti, S.Pd., M.Pd.',
    shs_vp_name = 'Aji Wahyu Budiyanto, M.Si',
    shs_principal_name = 'Dr Agustinus Joko Purwanto, S.Pd., M.M.'
WHERE id = 1;
