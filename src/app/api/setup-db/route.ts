import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'teacher', 'lab_assistant', 'student', 'principal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route, role)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read role_permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role_permissions" ON public.role_permissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage role_permissions" ON public.role_permissions;
CREATE POLICY "Super admin can manage role_permissions" ON public.role_permissions FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_role_permissions_route ON public.role_permissions(route);

CREATE TABLE IF NOT EXISTS public.principal_teacher_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(principal_id, teacher_id)
);
ALTER TABLE public.principal_teacher_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Anyone can read mappings" ON public.principal_teacher_mappings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admin can manage mappings" ON public.principal_teacher_mappings;
CREATE POLICY "Super admin can manage mappings" ON public.principal_teacher_mappings FOR ALL USING (public.is_admin());
CREATE INDEX IF NOT EXISTS idx_ptm_principal ON public.principal_teacher_mappings(principal_id);
CREATE INDEX IF NOT EXISTS idx_ptm_teacher ON public.principal_teacher_mappings(teacher_id);
`

export async function POST() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const connectionString = process.env.SUPABASE_DB_CONNECTION
    if (!connectionString) {
      return NextResponse.json({
        error: "SUPABASE_DB_CONNECTION not set",
        hint: "Add SUPABASE_DB_CONNECTION to Vercel env vars. Value: postgresql://postgres:...@db.yvnomvcmqsfbkqqjwzhi.supabase.co:5432/postgres",
      }, { status: 400 })
    }

    // Dynamic import pg (ESM compatible)
    const { Pool } = await import("pg")
    const pool = new Pool({ connectionString, max: 1 })
    
    try {
      await pool.query(SETUP_SQL)
      return NextResponse.json({ message: "Database setup complete! Tables created: role_permissions, principal_teacher_mappings" })
    } finally {
      await pool.end()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Setup failed" }, { status: 500 })
  }
}
