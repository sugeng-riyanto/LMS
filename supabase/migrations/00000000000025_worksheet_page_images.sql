ALTER TABLE public.shared_worksheets
ADD COLUMN IF NOT EXISTS page_images TEXT[] DEFAULT NULL;
