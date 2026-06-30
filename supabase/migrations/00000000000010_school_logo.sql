-- Add school logo URL
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS logo_url TEXT;
