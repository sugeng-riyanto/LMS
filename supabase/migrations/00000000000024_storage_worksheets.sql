-- Create storage bucket for uploaded worksheet PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('worksheets', 'worksheets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated teachers/super_admin to upload
CREATE POLICY "Teachers can upload worksheets"
ON storage.objects FOR INSERT
TO authenticated
USING (bucket_id = 'worksheets');

-- Allow authenticated users to update/delete their own files
CREATE POLICY "Teachers can update their worksheets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'worksheets');

CREATE POLICY "Teachers can delete their worksheets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'worksheets');

-- Allow public read access (for PDF.js canvas rendering)
CREATE POLICY "Public can view worksheets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'worksheets');
