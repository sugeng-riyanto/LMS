ALTER TABLE public.shared_worksheets
ADD COLUMN IF NOT EXISTS objectives TEXT,
ADD COLUMN IF NOT EXISTS reference_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS theory_video_url TEXT,
ADD COLUMN IF NOT EXISTS theory_video_title TEXT;
