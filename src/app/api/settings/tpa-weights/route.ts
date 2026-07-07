import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

// Use raw pg connection for reliable DDL + DML
async function query(sql: string, params?: any[]) {
  const connectionString = process.env.SUPABASE_DB_CONNECTION
  if (!connectionString) throw new Error("SUPABASE_DB_CONNECTION not set")
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString, max: 1 })
  try {
    const result = await pool.query(sql, params)
    return result
  } finally {
    await pool.end()
  }
}

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    // Ensure columns exist
    await query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70`)
    await query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30`)
    // Ensure row exists
    await query(`INSERT INTO public.school_settings (id, school_name) VALUES (1, 'SHB') ON CONFLICT (id) DO NOTHING`)

    const { rows } = await query(`SELECT tpa_principal_weight, tpa_teacher_weight FROM public.school_settings WHERE id = 1`)
    return NextResponse.json({
      principal: rows[0]?.tpa_principal_weight ?? 70,
      teacher: rows[0]?.tpa_teacher_weight ?? 30,
    })
  } catch (error: any) {
    return NextResponse.json({ principal: 70, teacher: 30, _debug: error?.message })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const body = await request.json()
    let { principal } = body as { principal: number }
    if (principal == null) return NextResponse.json({ error: "principal weight required" }, { status: 400 })
    principal = Math.max(0, Math.min(100, principal))
    const teacher = 100 - principal

    // Ensure table + columns + row
    await query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70`)
    await query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30`)
    await query(`INSERT INTO public.school_settings (id, school_name) VALUES (1, 'SHB') ON CONFLICT (id) DO NOTHING`)
    // Update weights
    await query(`UPDATE public.school_settings SET tpa_principal_weight = $1, tpa_teacher_weight = $2 WHERE id = 1`, [principal, teacher])

    return NextResponse.json({ principal, teacher })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
