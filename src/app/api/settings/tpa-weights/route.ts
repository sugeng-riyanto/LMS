import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"

async function ensureColumns() {
  try {
    const supabase = createAdminClient()
    // Try to do a simple operation first
    await (supabase.from("school_settings") as any).select("id").eq("id", 1).maybeSingle()
  } catch {
    // Table or columns missing - create them
    const connectionString = process.env.SUPABASE_DB_CONNECTION
    if (connectionString) {
      try {
        const { Pool } = await import("pg")
        const pool = new Pool({ connectionString, max: 1 })
        await pool.query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70`)
        await pool.query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30`)
        await pool.query(`INSERT INTO public.school_settings (id, school_name) VALUES (1, 'SHB') ON CONFLICT (id) DO NOTHING`)
        await pool.end()
      } catch {}
    }
  }
}

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError
    await ensureColumns()

    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("tpa_principal_weight, tpa_teacher_weight, assessment_scale")
      .eq("id", 1)
      .maybeSingle()

    return NextResponse.json({
      principal: data?.tpa_principal_weight ?? 70,
      teacher: data?.tpa_teacher_weight ?? 30,
      scale: data?.assessment_scale ?? "0-4",
    })
  } catch {
    return NextResponse.json({ principal: 70, teacher: 30, scale: "0-4" })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const body = await request.json()
    let { principal } = body as { principal: number }
    const { scale } = body as { scale?: string }
    if (principal == null) return NextResponse.json({ error: "principal weight required" }, { status: 400 })
    principal = Math.max(0, Math.min(100, principal))
    const teacher = 100 - principal

    await ensureColumns()
    const supabase = createAdminClient()
    const payload: any = { id: 1, school_name: "SHB", tpa_principal_weight: principal, tpa_teacher_weight: teacher }
    if (scale) payload.assessment_scale = scale

    const { error } = await (supabase.from("school_settings") as any).upsert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ principal, teacher, scale })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
