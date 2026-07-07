-- Create school_settings table if missing + add TPA weight columns
CREATE TABLE IF NOT EXISTS public.school_settings (
    id INT PRIMARY KEY DEFAULT 1,
    school_name TEXT,
    brand_name TEXT DEFAULT 'SHB Learning Hub',
    vp_name TEXT,
    principal_name TEXT,
    shs_vp_name TEXT,
    shs_principal_name TEXT,
    unit TEXT DEFAULT 'Academic',
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read school_settings" ON public.school_settings;
CREATE POLICY "Anyone can read school_settings" ON public.school_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can update school_settings" ON public.school_settings;
CREATE POLICY "Super admin can update school_settings" ON public.school_settings FOR ALL USING (public.is_admin());

INSERT INTO public.school_settings (id, school_name, brand_name) VALUES (1, 'Sekolah Harapan Bangsa', 'SHB Learning Hub')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70 CHECK (tpa_principal_weight >= 0 AND tpa_principal_weight <= 100);
ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30 CHECK (tpa_teacher_weight >= 0 AND tpa_teacher_weight <= 100);
