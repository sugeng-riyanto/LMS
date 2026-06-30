-- Add SHS-specific VP and Principal names
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS shs_vp_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS shs_principal_name TEXT NOT NULL DEFAULT '';
