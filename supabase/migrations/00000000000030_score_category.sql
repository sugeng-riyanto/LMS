ALTER TABLE shared_worksheets ADD COLUMN IF NOT EXISTS score_category TEXT;
ALTER TABLE syllabus_documents ADD COLUMN IF NOT EXISTS score_category TEXT;
