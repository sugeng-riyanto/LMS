-- Migration 00034: Classes (parallel classes) + Download Logs

-- Classes table (e.g. 7A, 7B, 8A, 8B, ...)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL CHECK (grade >= 7 AND grade <= 12),
  class_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes are viewable by all authenticated"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Classes are manageable by super_admin"
  ON classes FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');

-- Default classes for all grades
INSERT INTO classes (grade, class_name) VALUES
  (7, 'A'), (7, 'B'), (7, 'C'),
  (8, 'A'), (8, 'B'), (8, 'C'),
  (9, 'A'), (9, 'B'), (9, 'C'),
  (10, 'A'), (10, 'B'), (10, 'C'),
  (11, 'A'), (11, 'B'), (11, 'C'),
  (12, 'A'), (12, 'B'), (12, 'C')
ON CONFLICT DO NOTHING;

-- Download logs table
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  download_type TEXT NOT NULL,
  ip_address TEXT,
  geolocation TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Download logs viewable by super_admin"
  ON download_logs FOR SELECT
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Download logs insertable by authenticated"
  ON download_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
