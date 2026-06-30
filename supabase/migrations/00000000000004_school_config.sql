-- School configuration singleton table
-- Stores VP name, Principal name, school info for lesson plan templates

CREATE TABLE public.school_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    school_name TEXT NOT NULL DEFAULT 'Sekolah Harapan Bangsa - Modernhill',
    vp_name TEXT NOT NULL DEFAULT 'Christina Sri Waryanti, S.Pd.',
    principal_name TEXT NOT NULL DEFAULT 'Sisilia Juni Arianti, S.Pd., M.Pd.',
    shs_vp_name TEXT NOT NULL DEFAULT 'Aji Wahyu Budiyanto, M.Si',
    shs_principal_name TEXT NOT NULL DEFAULT 'Dr Agustinus Joko Purwanto, S.Pd., M.M.',
    unit TEXT NOT NULL DEFAULT 'Academic',
    address TEXT,
    phone TEXT,
    email TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read school settings"
    ON public.school_settings FOR SELECT
    USING (true);

CREATE POLICY "Only super_admin can modify school settings"
    ON public.school_settings FOR ALL
    USING (public.is_admin());

-- Insert default row
INSERT INTO public.school_settings (id, school_name, vp_name, principal_name, shs_vp_name, shs_principal_name, unit)
VALUES (1, 'Sekolah Harapan Bangsa - Modernhill', 'Christina Sri Waryanti, S.Pd.', 'Sisilia Juni Arianti, S.Pd., M.Pd.', 'Aji Wahyu Budiyanto, M.Si', 'Dr Agustinus Joko Purwanto, S.Pd., M.M.', 'Academic')
ON CONFLICT (id) DO NOTHING;
