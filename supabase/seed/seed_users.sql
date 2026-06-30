-- Seed Users for Physics Command Center
-- Run: psql -d your-db -f supabase/seed/seed_users.sql
-- Uses gen_random_uuid() from pgcrypto extension

INSERT INTO public.profiles (id, email, full_name, role, grade_assigned, is_active) VALUES
  (gen_random_uuid(), 'admin@shb.sch.id',    'Pak Gita',          'super_admin',  NULL,  true),
  (gen_random_uuid(), 'teacher@shb.sch.id',  'Bu Sarah',          'teacher',      NULL,  true),
  (gen_random_uuid(), 'lab@shb.sch.id',      'Mas Budi',          'lab_assistant',NULL,  true),
  (gen_random_uuid(), 'student1@shb.sch.id', 'Adi Pratama',       'student',      10,    true),
  (gen_random_uuid(), 'student2@shb.sch.id', 'Bunga Citra',       'student',      10,    true),
  (gen_random_uuid(), 'student3@shb.sch.id', 'Cahyo Nugroho',     'student',      11,    true),
  (gen_random_uuid(), 'student4@shb.sch.id', 'Dewi Sartika',      'student',      12,    true)
ON CONFLICT (email) DO UPDATE SET
  full_name       = EXCLUDED.full_name,
  role            = EXCLUDED.role,
  grade_assigned  = EXCLUDED.grade_assigned,
  is_active       = EXCLUDED.is_active;

-- Note: Placeholder hashed passwords (bcrypt rounds=10).
-- In production, users sign up via Supabase Auth or you set passwords
-- via the Supabase Dashboard Auth > Users panel.
-- Hash format: $2a$10$<22-char-salt><31-char-hash>
-- Example placeholder hash for "password123":
-- UPDATE auth.users SET encrypted_password = '$2a$10$PlaceholderSaltXabcdefghijklmnopqrstuvwxyzABCDEFGHIJ' WHERE email = 'admin@shb.sch.id';
-- These hashes are NOT valid - replace with real hashes via:
--   SELECT crypt('real-password', gen_salt('bf', 10));
